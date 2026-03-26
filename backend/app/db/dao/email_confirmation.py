from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import EmailConfirmation
from app.logger.file_logger import CustomLogger

logger = CustomLogger('email_confirmation_dao')


class EmailConfirmationDAO:
    """DAO для работы с подтверждениями email"""

    async def create(
        self,
        session: AsyncSession,
        *,
        user_id: int,
        token: str,
        expires_at: datetime,
    ) -> EmailConfirmation:
        """Создать запись подтверждения"""
        confirmation = EmailConfirmation(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
        )
        session.add(confirmation)
        await session.commit()
        await session.refresh(confirmation)
        return confirmation

    async def get_by_token(
        self,
        session: AsyncSession,
        token: str,
    ) -> Optional[EmailConfirmation]:
        """Получить подтверждение по токену (включая просроченные)"""
        stmt = select(EmailConfirmation).where(EmailConfirmation.token == token)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_valid_by_token(
        self,
        session: AsyncSession,
        token: str,
    ) -> Optional[EmailConfirmation]:
        """Получить подтверждение по токену (только действующие)"""
        stmt = select(EmailConfirmation).where(
            and_(
                EmailConfirmation.token == token,
                EmailConfirmation.expires_at > datetime.now(timezone.utc)
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_by_user_id(
        self,
        session: AsyncSession,
        user_id: int,
    ) -> None:
        """Удалить все подтверждения пользователя"""
        stmt = delete(EmailConfirmation).where(EmailConfirmation.user_id == user_id)
        await session.execute(stmt)
        await session.commit()

    async def delete(
        self,
        session: AsyncSession,
        confirmation: EmailConfirmation,
    ) -> None:
        """Удалить конкретное подтверждение"""
        await session.delete(confirmation)
        await session.commit()

    async def cleanup_expired(
        self,
        session: AsyncSession,
    ):
        """Удалить все просроченные подтверждения"""
        stmt = delete(EmailConfirmation).where(
            EmailConfirmation.expires_at <= datetime.now(timezone.utc)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount