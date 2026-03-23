from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import settings
from app.db.base import get_db
from app.db.dao.user import UserDAO
from app.dependencies.user import get_user_dao
from app.logger.file_logger import CustomLogger
from app.utils.jwt_utils import public_key

logger = CustomLogger('security')

security = HTTPBearer(auto_error=False)

async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao)
):
    """Получение текущего аутентифицированного пользователя"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        if not credentials:
            raise credentials_exception
        token = credentials.credentials
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[settings.algorithm],
        )

        user_id: int = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise credentials_exception

        try:
            user_id = int(user_id_str)
        except ValueError:
            raise credentials_exception

        user = await user_dao.get_by_id(session, user_id)
        if user is None:
            raise credentials_exception

        return user

    except JWTError as e:
        logger.error(f"JWT error: {e}")
        raise credentials_exception