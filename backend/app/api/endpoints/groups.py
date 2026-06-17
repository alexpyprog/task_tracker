from typing import List

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.params import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.base import get_db
from app.db.dao.group import GroupDAO
from app.db.dao.task import TaskDAO
from app.db.dao.user import UserDAO
from app.db.models import User
from app.dependencies.groups import get_group_dao
from app.dependencies.task import get_task_dao
from app.dependencies.user import get_user_dao
from app.models.group_schema import GroupOut, GroupCreate, GroupUpdate, TransferRequest, GroupListOut
from app.models.user_schema import ListUserOut, UserOut

rt = APIRouter(
    tags=['Groups'],
    prefix='/api/groups',
)

def register_router(app: FastAPI):
    app.include_router(rt)


@rt.get('/my-groups')
async def get_my_groups(
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao),
        task_dao: TaskDAO = Depends(get_task_dao)
) -> List[GroupListOut]:
    result = await group_dao.get_user_groups(session, current_user.id)
    groups = []
    for group in result:
        group_out = GroupListOut(
            id=group.id,
            name=group.name,
            description=group.description,
            manager_id=group.manager_id,
            created_at=group.created_at,
            members_count=await group_dao.get_members_count(session, group.id),
            tasks_count=len(await task_dao.get_by_group_id(session, group.id, None)),  # или отдельный метод
            icon=group.icon
        )
        groups.append(group_out)

    return groups


@rt.get('/{group_id}')
async def get_group_by_id(
        group_id: int,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao)
) -> GroupOut:
    group = await group_dao.get_by_id(session, group_id)
    if not group:
        raise HTTPException(status_code=404, detail='Group not found')
    if not await group_dao.is_member(session, group_id=group_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail='Forbidden')
    return GroupOut.model_validate(group)


@rt.post('/')
async def create_group(
        group_data: GroupCreate,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao)
) -> GroupOut:
    new_group = await group_dao.create(
        session=session,
        name=group_data.name,
        description=group_data.description,
        manager_id=current_user.id,
    )
    return GroupOut.model_validate(new_group)


@rt.patch('/{group_id}')
async def update_group(
        group_id: int,
        update_data: GroupUpdate,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao)
) -> GroupOut:
    upd_group = await group_dao.update(
        session=session,
        group_id=group_id,
        name=update_data.name,
        description=update_data.description,
        manager_id=update_data.manager_id,
        updated_by=current_user.id,
    )
    return GroupOut.model_validate(upd_group)


@rt.delete('/{group_id}')
async def delete_group(
        group_id: int,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao)
) -> dict:
    group = await group_dao.get_by_id(session, group_id)
    if not await group_dao.is_manager(session, group_id=group_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail='Forbidden')  # TODO: Уведомить о попытке удаления группы
    if not group:
        raise HTTPException(status_code=404, detail='Group not found')
    result = await group_dao.delete(session, group_id)
    return {'success': result}


@rt.get('/{group_id}/members')
async def get_group_members(
        group_id: int,
        skip: int = Query(0, ge=0, description="Количество пропускаемых записей"),
        limit: int = Query(100, ge=1, le=1000, description="Лимит записей"),
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao)
) -> List[ListUserOut]:
    if not await group_dao.is_member(session, group_id=group_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    members = await group_dao.get_members(
        session=session,
        group_id=group_id,
        skip=skip,
        limit=limit,
    )

    users = []
    for member in members:
        is_manager = await group_dao.is_manager(session, group_id=group_id, user_id=member.id)
        role = 'manager' if is_manager else 'member'
        ug = await group_dao.get_join_date(session, group_id=group_id, user_id=member.id)
        joined_at = ug.joined_at
        user_out = UserOut.model_validate(member)
        user = ListUserOut(
            **user_out.model_dump(),
            role=role,
            joined_at=joined_at
        )
        users.append(user)
    return users


@rt.delete('/{group_id}/members/{user_id}')
async def delete_group_member(
        group_id: int,
        user_id: int,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao),
        user_dao: UserDAO = Depends(get_user_dao)
) -> dict:
    if not await group_dao.is_manager(session, group_id=group_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")  # TODO: Добавить уведомление
    user = await user_dao.get_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if not await group_dao.is_member(session, group_id=group_id, user_id=user_id):
        raise HTTPException(status_code=404, detail="User is not a member of this group")
    if await group_dao.is_manager(session=session, group_id=group_id, user_id=user_id):
        raise HTTPException(status_code=400, detail="Cannot remove group manager. Transfer ownership first.")
    result = await group_dao.remove_member(session, group_id=group_id, user_id=user_id)
    return {'success': result}


@rt.post('/{group_id}/leave')
async def leave_group(
        group_id: int,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao),
) -> dict:
    is_manager = await group_dao.is_manager(session, group_id=group_id, user_id=current_user.id)
    if is_manager:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove group manager. Transfer ownership first."
        )
    result = await group_dao.remove_member(session, group_id=group_id, user_id=current_user.id)
    return {'success': result}


@rt.post('/{group_id}/transfer')
async def transfer_manager(
        group_id: int,
        data: TransferRequest,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao),
        user_dao: UserDAO = Depends(get_user_dao),
) -> dict:
    is_manager = await group_dao.is_manager(session, group_id=group_id, user_id=current_user.id)
    if not is_manager:
        raise HTTPException(status_code=403, detail="Forbidden")
    new_manager = await user_dao.get_by_id(session, data.new_manager_id)
    if not new_manager:
        raise HTTPException(status_code=404, detail="User not found")
    result = await group_dao.transfer_management(
        session=session,
        group_id=group_id,
        current_manager_id=current_user.id,
        new_manager_id=data.new_manager_id,
        updated_by=current_user.id,
    )
    return {'success': result}