import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict

from sqlalchemy import select, delete, result_tuple, and_, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import InvitationStatus
from app.core.settings import settings
from app.db.models import Invitation
from app.logger.file_logger import CustomLogger

logger = CustomLogger('InvitationDAO')


class InvitationDAO:

    async def create_invitation(
            self,
            session: AsyncSession,
            from_user: int,
            to_user: int,
            group_id: int
    ) -> Invitation:
        invitation = Invitation(
            id=str(uuid.uuid4()),
            from_user=from_user,
            to_user=to_user,
            group_id=group_id,
            status=InvitationStatus.pending
        )
        session.add(invitation)
        await session.commit()
        await session.refresh(invitation)
        return invitation

    async def get_by_id(
            self,
            session: AsyncSession,
            invitation_id: str,
    ) -> Invitation:
        stmt = select(Invitation).where(Invitation.id == invitation_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_incoming(
            self,
            session: AsyncSession,
            user_id
    ) -> List[Invitation]:
        stmt = select(Invitation).where(Invitation.to_user == user_id)
        result = await session.execute(stmt)
        return [inv for inv in result.scalars().all()]

    async def get_outgoing(
            self,
            session: AsyncSession,
            user_id
    ) -> List[Invitation]:
        stmt = select(Invitation).where(Invitation.from_user == user_id)
        result = await session.execute(stmt)
        return [inv for inv in result.scalars().all()]

    async def delete_invitation(
            self,
            session: AsyncSession,
            invitation_id: str,
    ) -> bool:
        stmt = delete(Invitation).where(Invitation.id == invitation_id)
        try:
            await session.execute(stmt)
            await session.commit()
            logger.info(f"Invitation deleted: {invitation_id}")
            return True
        except SQLAlchemyError as e:
            logger.error(f"Could not delete Invitation {invitation_id}: {e}")
            return False

    async def check_invitation_limit(
            self,
            session: AsyncSession,
            from_user: int,
            to_user: int,
    ) -> Dict:
        stmt = select(Invitation).where(
            and_(Invitation.from_user == from_user,
                 Invitation.to_user == to_user)
        )
        result = await session.execute(stmt)
        sent_total = len(result.scalars().all())
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        sent_today = any(inv.created_at > today_start for inv in result.scalars().all())
        limit = settings.invitation_per_user_limit
        return {
            'can_send': sent_total < limit,
            'limit': limit,
            'sent_today': sent_today,
            'reset_time': today_start+timedelta(hours=1),
            'remaining': limit-sent_total
        }

    async def update(
            self,
            session: AsyncSession,
            invitation_id: str,
            status: InvitationStatus
    ) -> bool:
        stmt = (
            update(Invitation)
            .where(Invitation.id == invitation_id)
            .values(status=status)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount > 0
