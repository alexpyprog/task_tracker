from fastapi import APIRouter, Depends, HTTPException, status, FastAPI
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.dao.user import UserDAO
from app.dependencies.user import get_user_dao
from app.core.security import get_current_user
from app.db.models import User
from app.utils.pwd_utils import verify_password

verify_rt = APIRouter(
    tags=["Verify"],
    prefix='/api'
)


def register_router(app: FastAPI):
    app.include_router(verify_rt)


class PasswordVerifyRequest(BaseModel):
    password: str = Field(..., min_length=8, max_length=255)


@verify_rt.post(
    "/verify-password",
    status_code=status.HTTP_200_OK,
    description="Verify current user's password"
)
async def verify_password_endpoint(
        data: PasswordVerifyRequest,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao)
) -> dict:
    """
    Verify the current user's password.
    Returns 200 if password is correct, 401 otherwise.
    """
    user = await user_dao.get_by_id(session, current_user.id)

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    return {"verified": True}