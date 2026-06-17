from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, FastAPI
from fastapi.params import Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.base import get_db
from app.db.dao.group import GroupDAO
from app.db.dao.user import UserDAO
from app.db.models import User
from app.dependencies.groups import get_group_dao
from app.dependencies.user import get_user_dao
from app.models.user_schema import *

users_rt = APIRouter(prefix='/api/users', tags=['User'])

def register_router(app: FastAPI):
    app.include_router(users_rt)


@users_rt.get(
    '/all',
    response_model=List[UserOut]
)
async def get_all_users(
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao),
) -> list[UserOut]:
    all_users = await user_dao.list_users(
        session,
    )
    return [UserOut.model_validate(user) for user in all_users]


@users_rt.get(
    "/by-username/{username}",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    description='Найти пользователя по его username'
)
async def get_user_by_username(
        username: str,
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao),
) -> UserOut:
    """
    Найти пользователя по его username.
    :param username: Username
    :param session: Database session. Automatically populated.
    :param user_dao: UserDAO. Automatically populated.
    :return: UserOut model
    """
    user = await user_dao.get_by_username(session, username)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserOut.model_validate(user)


@users_rt.get(
    '/me',
    description='Получить информацию о текущем пользователе'
)
async def get_me(
        current_user: User = Depends(get_current_user),
) -> UserOut:
    return UserOut.model_validate(current_user)


@users_rt.get(
    "/search",
    response_model=List[UserOut],
    description='Поиск пользователей с фильтрацией по группе'
)
async def search_users(
        q: str = Query("", min_length=0, max_length=100, description="Поисковый запрос"),
        group_id: Optional[int] = Query(None, description="ID группы (если указан, ищем только участников)"),
        skip: int = Query(0, ge=0, description="Количество пропускаемых записей"),
        limit: int = Query(20, ge=1, le=100, description="Лимит записей"),
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao),
        group_dao: GroupDAO = Depends(get_group_dao),
        current_user: User = Depends(get_current_user),
) -> List[UserOut]:
    """
    Поиск пользователей.
    Если указан group_id - ищем только среди участников группы.
    """
    users = []

    if group_id:
        # Проверяем, что текущий пользователь имеет доступ к группе
        if not await group_dao.is_member(session, group_id=group_id, user_id=current_user.id):
            raise HTTPException(status_code=403, detail="Forbidden")

        # Получаем участников группы
        members = await group_dao.get_members(session, group_id=group_id, skip=skip, limit=limit)

        # Фильтруем по поисковому запросу
        search_lower = q.lower()
        for member in members:
            if (not q or
                    search_lower in member.username.lower() or
                    search_lower in member.full_name.lower() or
                    search_lower in member.email.lower()):
                users.append(member)
    else:
        # Поиск по всем пользователям
        all_users = await user_dao.list_users(session)

        # Фильтруем по поисковому запросу
        search_lower = q.lower()
        for user in all_users:
            if (not q or
                    search_lower in user.username.lower() or
                    search_lower in user.full_name.lower() or
                    search_lower in user.email.lower()):
                users.append(user)

        # Применяем skip и limit
        users = users[skip:skip + limit]

    return [UserOut.model_validate(user) for user in users]


@users_rt.get(
    "/{user_id}",
    response_model=UserOut,
    status_code=status.HTTP_200_OK,
    description='Найти пользователя по его ID'
)
async def get_user(
        user_id: int,
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao),
) -> UserOut:
    """
    Найти пользователя по его ID
    :param user_id: User ID
    :param session: Database session. Automatically populated.
    :param user_dao: UserDAO. Automatically populated.
    :return: UserOut model
    """
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
    description='Обновить информацию о пользователе'
)
async def update_user(
        user_id: int,
        data: UserUpdate,
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao),
        current_user: User = Depends(get_current_user),
) -> UserOut:
    """
    Обновить информацию о пользователе
    :param current_user: Current user data
    :param user_id: User ID
    :param data: Full dataset of the UserUpdate model
    :param session: Database session. Automatically populated.
    :param user_dao: UserDAO. Automatically populated.
    :return: UserOut model
    """
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action",
        )
    user = await user_dao.update_profile(
        session=session,
        user_id=user_id,
        full_name=data.full_name,
        phone=data.phone,
        profile_photo_path=data.profile_photo_path,
        password=data.password,
        email=data.email,
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
    description='Удалить пользователя'
)
async def delete_user(
        user_id: int,
        session: AsyncSession = Depends(get_db),
        user_dao: UserDAO = Depends(get_user_dao),
        group_dao: GroupDAO = Depends(get_group_dao)
) -> dict[str, Any]:
    """
    Удалить пользователя
    :param group_dao: GroupDAO. Automatically populated.
    :param user_id: User ID
    :param session: Database session. Automatically populated.
    :param user_dao: UserDAO. Automatically populated.
    :return: Dictionary of deleted user data
    """
    deleted = await user_dao.delete(
        session=session,
        user_id=user_id,
        group_dao=group_dao
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return {'result': deleted}