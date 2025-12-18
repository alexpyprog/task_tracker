from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.db.dao.user import UserDAO
from app.dependencies.user import get_user_dao
from app.models.user_schema import *

users_rt = APIRouter(prefix='/user', tags=['User'])


@users_rt.get(
    "/",
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
    return UserOut.model_validate(user)


@users_rt.patch(
    "/{user_id}",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
)
async def update_user(
    user_id: int,
    data: UserUpdate,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao),
) -> UserOut:
    user = await user_dao.update_profile(
        session=session,
        user_id=user_id,
        full_name=data.full_name,
        phone=data.phone,
        profile_photo_path=data.profile_photo_path,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserOut.model_validate(user)


@users_rt.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    user_dao: UserDAO = Depends(get_user_dao),
) -> dict[str, Any]:
    deleted = await user_dao.delete(
        session=session,
        user_id=user_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return {'result': deleted}