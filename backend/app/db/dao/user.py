from typing import Optional

from sqlalchemy import select, update, exists, delete
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dao.group import GroupDAO
from app.db.models import User
from app.core.enums import UserStatus
from app.logger.file_logger import CustomLogger
from app.utils.pwd_utils import hash_password

logger = CustomLogger('user_dao')


class UserDAO:
    # ---------- get ----------

    async def get_by_id(
        self,
        session: AsyncSession,
        user_id: int,
    ) -> User | None:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(
        self,
        session: AsyncSession,
        username: str,
    ) -> User | None:
        stmt = select(User).where(User.username == username)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(
        self,
        session: AsyncSession,
        email: str,
    ) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    # ---------- exists ----------

    async def username_exists(
        self,
        session: AsyncSession,
        username: str,
    ) -> bool:
        stmt = select(exists().where(User.username == username))
        result = await session.execute(stmt)
        return bool(result.scalar())

    async def email_exists(
        self,
        session: AsyncSession,
        email: str,
    ) -> bool:
        stmt = select(exists().where(User.email == email))
        result = await session.execute(stmt)
        return bool(result.scalar())

    # ---------- create ----------

    async def create(
        self,
        session: AsyncSession,
        *,
        username: str,
        full_name: str,
        email: str,
        phone: str,
        hashed_password: bytes,
        organization_id: int | None = None,
    ) -> User:
        existing_user = await self.get_by_username(session, username)
        if existing_user:
            raise
        user = User(
            username=username,
            full_name=full_name,
            email=email,
            phone=phone,
            hashed_password=hashed_password,
            organization_id=organization_id,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    # ---------- update ----------

    async def update_profile(
        self,
        session: AsyncSession,
        *,
        user_id: int,
        full_name: str | None = None,
        phone: str | None = None,
        profile_photo_path: str | None = None,
        password: Optional[str] = None,
        email: str | None = None,
    ) -> None:
        values = {}
        existing_user = await self.get_by_id(session, user_id)

        if full_name is not None:
            values["full_name"] = full_name
        if phone is not None:
            values["phone"] = phone
        if profile_photo_path is not None:
            values["profile_photo_path"] = profile_photo_path
        if password is not None:
            hashed_password = hash_password(password)
            values["hashed_password"] = hashed_password
        if email is not None:
            values["email"] = email


        if not values:
            return existing_user

        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(**values)
            .returning(User)
        )
        result = await session.execute(stmt)
        await session.commit()
        user = result.scalar_one_or_none()
        return user


    async def set_verified(
        self,
        session: AsyncSession,
        *,
        user_id: int,
        verified: bool,
    ) -> None:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(verified=verified)
        )
        await session.execute(stmt)
        await session.commit()

    async def change_status(
        self,
        session: AsyncSession,
        *,
        user_id: int,
        status: UserStatus,
    ) -> None:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(user_status=status)
        )
        await session.execute(stmt)
        await session.commit()

    # ---------- organization / group ----------

    async def assign_to_group(
        self,
        session: AsyncSession,
        *,
        user_id: int,
        group_id: int,
    ) -> None:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(group_id=group_id)
        )
        await session.execute(stmt)
        await session.commit()

    async def assign_to_organization(
        self,
        session: AsyncSession,
        *,
        user_id: int,
        organization_id: int | None,
    ) -> None:
        stmt = (
            update(User)
            .where(User.id == user_id)
            .values(organization_id=organization_id)
        )
        await session.execute(stmt)
        await session.commit()

    # ---------- admin ----------

    async def list_users(
        self,
        session: AsyncSession,
        *,
        organization_id: int | None = None,
        group_id: int | None = None,
        status: UserStatus | None = None
    ) -> list[User]:
        stmt = select(User)

        if organization_id is not None:
            stmt = stmt.where(User.organization_id == organization_id)
        if group_id is not None:
            stmt = stmt.where(User.group_id == group_id)
        if status is not None:
            stmt = stmt.where(User.user_status == status)

        stmt = stmt

        result = await session.execute(stmt)
        return list(result.scalars())

    # app/db/dao/user.py (дополнение в delete метод)

    async def delete(
            self,
            session: AsyncSession,
            *,
            user_id: int,
            group_dao: GroupDAO,  # инжектим зависимость
    ) -> bool:
        """Удалить пользователя с автоматическим переназначением менеджеров"""
        try:
            # 1. Получаем все группы, где пользователь менеджер
            managed_groups = await group_dao.get_groups_where_manager(session, user_id)

            # 2. Пытаемся переназначить менеджеров
            failed_groups = []
            for group in managed_groups:
                success = await group_dao.auto_reassign_manager(
                    session,
                    group.id,
                    user_id
                )
                if not success:
                    failed_groups.append(group.id)

            # 3. Если есть группы без менеджера — запрещаем удаление
            if failed_groups:
                logger.error(f"Cannot delete user {user_id}: groups without manager: {failed_groups}")
                return False

            # 4. Удаляем пользователя (каскад удалит связи в user_groups)
            stmt = delete(User).where(User.id == user_id)
            await session.execute(stmt)
            await session.commit()

            logger.info(f"User {user_id} deleted with manager reassignment")
            return True

        except SQLAlchemyError as e:
            logger.error(f'Error deleting user {user_id}: {e}')
            await session.rollback()
            return False

