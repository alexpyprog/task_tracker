from datetime import datetime, timezone, timedelta

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import settings
from app.db.base import get_db
from app.db.dao.user import UserDAO
from app.dependencies.user import get_user_dao

with open(settings.private_key) as f:
    private_key = f.read()

with open(settings.public_key) as f:
    public_key = f.read()

# Добавляем объявление security
security = HTTPBearer()


def _create_token(
    *,
    subject: str,
    token_type: str,
    expires_delta: timedelta,
) -> str:
    now = datetime.now(tz=timezone.utc)

    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }

    return jwt.encode(payload, private_key, algorithm=settings.algorithm)


def create_access_token(user_id: int) -> str:
    return _create_token(
        subject=str(user_id),
        token_type="access",
        expires_delta=settings.access_token_expire,
    )


def create_refresh_token(user_id: int) -> str:
    return _create_token(
        subject=str(user_id),
        token_type="refresh",
        expires_delta=settings.refresh_token_expire,
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            public_key,
            algorithms=[settings.algorithm],
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao)
) -> dict:
    """Верификация токена и получение payload"""
    try:
        token = credentials.credentials
        payload = decode_token(token)

        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        # Проверяем, существует ли пользователь
        user = await user_dao.get_by_id(session, int(user_id))
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        return payload

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def refresh_access_token(
    refresh_token: str,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao)
) -> str:
    """Обновление access токена с помощью refresh токена"""
    try:
        payload = decode_token(refresh_token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        # Проверяем, существует ли пользователь
        user = await user_dao.get_by_id(session, int(user_id))
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        # Создаем новый access токен
        new_access_token = create_access_token(user.id)
        return new_access_token

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
