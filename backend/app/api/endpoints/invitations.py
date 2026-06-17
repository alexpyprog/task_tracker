from typing import List

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import InvitationStatus
from app.core.security import get_current_user
from app.db.dao.group import GroupDAO
from app.db.dao.invitations import InvitationDAO
from app.db.dao.user import UserDAO
from app.db.models import User, Invitation
from app.db.base import get_db
from app.dependencies.groups import get_group_dao
from app.dependencies.invitations import get_inv_dao
from app.dependencies.user import get_user_dao
from app.models.invitation_schema import InvitationOut, InvitationCreate

rt = APIRouter(
    tags=['Group invitations'],
    prefix='/api/invitations',
)

def register_router(app: FastAPI):
    app.include_router(rt)


@rt.get('/my')
async def get_invitations(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db),
        inv_dao: InvitationDAO = Depends(get_inv_dao)
) -> List[InvitationOut]:
    invitations = await inv_dao.get_incoming(session, current_user.id)
    return [InvitationOut.model_validate(inv) for inv in invitations]


@rt.get('/incoming')
async def get_incoming_invitations(
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        inv_dao: InvitationDAO = Depends(get_inv_dao),
) -> List[InvitationOut]:
    invitations = await inv_dao.get_incoming(session, current_user.id)
    return [InvitationOut.model_validate(inv) for inv in invitations]


@rt.get('/outgoing')
async def get_outgoing_invitations(
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        inv_dao: InvitationDAO = Depends(get_inv_dao)
) -> List[InvitationOut]:
    invitations = await inv_dao.get_outgoing(session, current_user.id)
    return [InvitationOut.model_validate(inv) for inv in invitations]


@rt.get('/{invitation_id}')
async def get_invitation(
        invitation_id: str,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        inv_dao: InvitationDAO = Depends(get_inv_dao)
) -> InvitationOut:
    invitation = await inv_dao.get_by_id(session, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail='Invitation not found')
    if current_user.id != invitation.to_user and \
        current_user.id != invitation.from_user:
        raise HTTPException(status_code=403, detail='Not allowed')
    return InvitationOut.model_validate(invitation)


@rt.post('/')
async def send_invitation(
        data: InvitationCreate,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao),
        user_dao: UserDAO = Depends(get_user_dao),
        inv_dao: InvitationDAO = Depends(get_inv_dao),
) -> InvitationOut:
    # 1. Проверка прав (только менеджер)
    if not await group_dao.is_manager(session, group_id=data.group_id, user_id=current_user.id):
        raise HTTPException(status_code=403, detail="Only manager can invite")

    # 2. Находим приглашаемого пользователя
    if data.to_user_id:
        invited_user = await user_dao.get_by_id(session, data.to_user_id)
    elif data.email:
        invited_user = await user_dao.get_by_email(session, data.email)
    else:
        raise HTTPException(status_code=400, detail="Either to_user_id or email is required")

    if not invited_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. Проверка, что не приглашаем себя и что пользователь не в группе
    if invited_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")

    if await group_dao.is_member(session, group_id=data.group_id, user_id=invited_user.id):
        raise HTTPException(status_code=400, detail="User already in group")

    # 4. Создаем приглашение
    invitation = await inv_dao.create_invitation(
        session=session,
        from_user=current_user.id,
        to_user=invited_user.id,
        group_id=data.group_id,
    )

    return InvitationOut.model_validate(invitation)


@rt.post('/{invitation_id}/accept')
async def accept_invitation(
        invitation_id: str,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao),
        inv_dao: InvitationDAO = Depends(get_inv_dao)
) -> dict:
    invitation = await inv_dao.get_by_id(session, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if current_user.id != invitation.to_user:
        raise HTTPException(status_code=403, detail="Only invitation receiver can accept invitation")
    is_member = await group_dao.is_member(session, group_id=invitation.group_id, user_id=current_user.id)
    if is_member:
        raise HTTPException(status_code=400, detail="Already accepted")

    result = await group_dao.add_member(
        session,
        group_id=invitation.group_id,
        user_id=current_user.id
    )
    await inv_dao.update(
        session,
        invitation_id,
        status=InvitationStatus.accepted,
    )

    return {'success': result}


@rt.post('/{invitation_id}/decline')
async def decline_invitation(
        invitation_id: str,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        group_dao: GroupDAO = Depends(get_group_dao),
        inv_dao: InvitationDAO = Depends(get_inv_dao)
) -> dict:
    invitation = await inv_dao.get_by_id(session, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    if current_user.id != invitation.to_user:
        raise HTTPException(status_code=403, detail="Only invitation receiver can decline invitation")
    is_member = await group_dao.is_member(session, group_id=invitation.group_id, user_id=current_user.id)

    if is_member:
        raise HTTPException(status_code=400, detail="Already member of the group")

    result = await inv_dao.update(
        session,
        invitation_id,
        status=InvitationStatus.declined,
    )
    return {'success': result}


@rt.delete('/{invitation_id}')
async def cancel_invitation(
        invitation_id: str,
        session: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        inv_dao: InvitationDAO = Depends(get_inv_dao)
) -> dict:
    invitation = await inv_dao.get_by_id(session, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if current_user.id != invitation.from_user:
        raise HTTPException(status_code=403, detail="Only invitation sender can cancel invitation")

    result = await inv_dao.delete_invitation(
        session,
        invitation_id,
    )
    return {'success': result}