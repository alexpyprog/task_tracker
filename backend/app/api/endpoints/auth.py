from fastapi import APIRouter, Depends, HTTPException, status, Body, FastAPI
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.dao.user import UserDAO
from app.dependencies.user import get_user_dao
from app.models.login_schema import UserLogin, TokenPairOut
from app.models.user_schema import UserOut, UserCreate
from app.utils.jwt_utils import create_access_token, create_refresh_token, refresh_access_token, decode_token
from app.utils.pwd_utils import hash_password, verify_password

auth_rt = APIRouter(
    tags=["Auth"],
    prefix='/api'
)

def register_router(app: FastAPI):
    app.include_router(auth_rt)


@auth_rt.post(
    '/register',
    response_model=UserOut,
    description='Create a new user'
)
async def create_user(
    data: UserCreate,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao),
) -> UserOut:
    """
    Create a new user
    :param data: Full dataset of the UserCreate model
    :param session: Database session. Automatically populated.
    :param user_dao: UserDAO. Automatically populated.
    :return: UserOut model
    """
    try:
        user = await user_dao.create(
            session=session,
            username=data.username,
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            hashed_password=hash_password(data.password),
            group_id=data.group_id,
            organization_id=data.organization_id,
        )

        return UserOut.model_validate(user)
    except Exception:
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with username {data.username} already exists"
            )


@auth_rt.post(
    "/login",
    response_model=TokenPairOut,
    status_code=status.HTTP_200_OK,
    description=
    '''Аутентификация пользователя по логину и паролю.
При успешной проверке учетных данных возвращает пару JWT-токенов: \n'''
    'access_token для доступа к защищенным эндпоинтам и refresh_token для обновления access_token. '
    'Валидирует соответствие хеша пароля в базе данных, при несоответствии возвращает ошибку 401.'
)
async def login(
    data: UserLogin,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao),
) -> TokenPairOut:
    """
    Аутентификация пользователя по логину и паролю.
    При успешной проверке учетных данных возвращает пару JWT-токенов:
    access_token для доступа к защищенным эндпоинтам и refresh_token
    для обновления access_token. Валидирует соответствие хеша пароля
    в базе данных, при несоответствии возвращает ошибку 401.
    :param data: Full dataset of the UserLogin model
    :param session: Database session. Automatically populated.
    :param user_dao: UserDAO. Automatically populated.
    :return: TokenPairOut model
    """
    user = await user_dao.get_by_username(session, data.username)

    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    return TokenPairOut(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


@auth_rt.post(
    "/refresh",
    response_model=TokenPairOut,
    description='Обновление access токена с помощью refresh токена. '
    'Возвращает новую пару токенов.'
)
async def refresh_tokens(
        refresh_token: str = Body(..., embed=True),
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao)
) -> TokenPairOut:
    """
    Обновление access токена с помощью refresh токена.
    Возвращает новую пару токенов.
    :param refresh_token: refresh_token received during system authorization
    :param session: Database session. Automatically populated.
    :param user_dao: UserDAO. Automatically populated.
    :return: TokenPairOut model
    """
    # Получаем новый access токен
    new_access_token = await refresh_access_token(refresh_token, session, user_dao)

    # Декодируем refresh токен для получения user_id
    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")

        # Создаем новый refresh токен (ротация refresh токена)
        new_refresh_token = create_refresh_token(int(user_id))

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    return TokenPairOut(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )