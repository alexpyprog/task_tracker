from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.dao.user import UserDAO
from app.dependencies.user import get_user_dao
from app.models.login_schema import UserLogin, TokenPairOut
from app.models.user_schema import UserOut, UserCreate
from app.utils.jwt_utils import create_access_token, create_refresh_token
from app.utils.pwd_utils import hash_password, verify_password

auth_rt = APIRouter(tags=["Auth"])


@auth_rt.post('/register', response_model=UserOut)
async def create_user(
    data: UserCreate,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao),
) -> UserOut:
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


@auth_rt.post(
    "/login",
    response_model=TokenPairOut,
    status_code=status.HTTP_200_OK,
)
async def login(
    data: UserLogin,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao),
) -> TokenPairOut:
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
