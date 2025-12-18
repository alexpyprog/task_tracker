from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.dao.user import UserDAO
from app.dependencies.user import get_user_dao
from app.models.user_schema import UserOut

users_rt = APIRouter()


@users_rt.get(
    "/user",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao),
) -> UserOut:
    user = await user_dao.get_by_id(session, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
    # return UserOut.model_validate(user)
