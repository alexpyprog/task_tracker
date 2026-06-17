from datetime import datetime
from typing import List, Optional

from sqlalchemy import select, delete, and_, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Group, User, UserGroup
from app.logger.file_logger import CustomLogger

logger = CustomLogger('group_dao')


class GroupDAO:
    """DAO для управления группами и участниками"""

    # ========== ГРУППЫ ==========

    async def get_by_id(
        self,
        session: AsyncSession,
        group_id: int,
    ) -> Group | None:
        """Получить группу по ID"""
        stmt = select(Group).where(Group.id == group_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name(
        self,
        session: AsyncSession,
        name: str,
        organization_id: Optional[int] = None,
    ) -> Group | None:
        """Получить группу по имени (опционально в рамках организации)"""
        stmt = select(Group).where(Group.name == name)
        if organization_id is not None:
            stmt = stmt.where(Group.organization_id == organization_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_organization(
        self,
        session: AsyncSession,
        organization_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Group]:
        """Получить все группы организации"""
        stmt = (
            select(Group)
            .where(Group.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
            .order_by(Group.created_at.desc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_manager(
        self,
        session: AsyncSession,
        manager_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Group]:
        """Получить группы, где пользователь является менеджером"""
        stmt = (
            select(Group)
            .where(Group.manager_id == manager_id)
            .offset(skip)
            .limit(limit)
            .order_by(Group.created_at.desc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_groups(
        self,
        session: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Group]:
        """Получить все группы, в которых состоит пользователь"""
        stmt = (
            select(Group)
            .join(UserGroup, UserGroup.group_id == Group.id)
            .where(UserGroup.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(Group.created_at.desc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self,
        session: AsyncSession,
        *,
        name: str,
        description: str,
        manager_id: int,
        organization_id: Optional[int] = None,
    ) -> Group:
        """Создать новую группу"""
        group = Group(
            name=name,
            description=description,
            manager_id=manager_id,
            organization_id=organization_id,
            updated_by=manager_id
        )
        session.add(group)
        await session.commit()
        await session.refresh(group)

        # Автоматически добавляем создателя (менеджера) в группу
        await self.add_member(session, group_id=group.id, user_id=manager_id)

        logger.info(f"Group created: {group.id} (name: {name}) by manager {manager_id}")
        return group

    async def update(
        self,
        session: AsyncSession,
        group_id: int,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        manager_id: Optional[int] = None,
        updated_by: int,
    ) -> Group | None:
        """Обновить информацию о группе"""
        values = {}
        if name is not None:
            values["name"] = name
        if manager_id is not None:
            values["manager_id"] = manager_id
        if description is not None:
            values["description"] = description
            # При смене менеджера нужно убедиться, что новый менеджер состоит в группе
            # (это должна делать вызывающая сторона)

        if not values:
            group = await self.get_by_id(session, group_id)
            return group

        values["updated_by"] = updated_by

        stmt = (
            select(Group)
            .where(Group.id == group_id)
            .with_for_update()
        )
        result = await session.execute(stmt)
        group = result.scalar_one_or_none()

        if group:
            for key, value in values.items():
                setattr(group, key, value)
            await session.commit()
            await session.refresh(group)
            logger.info(f"Group updated: {group_id} by user {updated_by}")

        return group

    async def delete(
        self,
        session: AsyncSession,
        group_id: int,
    ) -> bool:
        """Удалить группу (каскадно удалит связи в user_groups)"""
        try:
            stmt = delete(Group).where(Group.id == group_id)
            result = await session.execute(stmt)
            await session.commit()

            if result.rowcount > 0:
                logger.info(f"Group deleted: {group_id}")
                return True
            return False
        except SQLAlchemyError as e:
            logger.error(f"Error deleting group {group_id}: {e}")
            await session.rollback()
            return False

    # ========== УЧАСТНИКИ ==========

    async def add_member(
        self,
        session: AsyncSession,
        *,
        group_id: int,
        user_id: int,
    ) -> bool:
        """Добавить пользователя в группу"""
        # Проверяем, не состоит ли уже
        if await self.is_member(session, group_id=group_id, user_id=user_id):
            logger.warning(f"User {user_id} is already in group {group_id}")
            return False

        try:
            user_group = UserGroup(
                group_id=group_id,
                user_id=user_id,
            )
            session.add(user_group)
            await session.commit()
            logger.info(f"User {user_id} added to group {group_id}")
            return True
        except SQLAlchemyError as e:
            logger.error(f"Error adding user {user_id} to group {group_id}: {e}")
            await session.rollback()
            return False

    async def remove_member(
        self,
        session: AsyncSession,
        *,
        group_id: int,
        user_id: int,
    ) -> bool:
        """Удалить пользователя из группы"""
        # Нельзя удалить менеджера (это должно проверяться в бизнес-логике)
        group = await self.get_by_id(session, group_id)
        if group and group.manager_id == user_id:
            logger.warning(f"Cannot remove manager {user_id} from group {group_id}")
            return False

        try:
            stmt = delete(UserGroup).where(
                and_(
                    UserGroup.group_id == group_id,
                    UserGroup.user_id == user_id,
                )
            )
            result = await session.execute(stmt)
            await session.commit()

            if result.rowcount > 0:
                logger.info(f"User {user_id} removed from group {group_id}")
                return True
            return False
        except SQLAlchemyError as e:
            logger.error(f"Error removing user {user_id} from group {group_id}: {e}")
            await session.rollback()
            return False

    async def get_members(
        self,
        session: AsyncSession,
        group_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[User]:
        """Получить список участников группы"""
        stmt = (
            select(User)
            .join(UserGroup, UserGroup.user_id == User.id)
            .where(UserGroup.group_id == group_id)
            .offset(skip)
            .limit(limit)
            .order_by(User.username)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_members_count(
        self,
        session: AsyncSession,
        group_id: int,
    ) -> int:
        """Получить количество участников группы"""
        stmt = (
            select(func.count())
            .select_from(UserGroup)
            .where(UserGroup.group_id == group_id)
        )
        result = await session.execute(stmt)
        return result.scalar() or 0

    async def is_member(
        self,
        session: AsyncSession,
        *,
        group_id: int,
        user_id: int,
    ) -> bool:
        """Проверить, является ли пользователь участником группы"""
        stmt = select(UserGroup).where(
            and_(
                UserGroup.group_id == group_id,
                UserGroup.user_id == user_id,
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def is_manager(
        self,
        session: AsyncSession,
        *,
        group_id: int,
        user_id: int,
    ) -> bool:
        """Проверить, является ли пользователь менеджером группы"""
        stmt = select(Group).where(
            and_(
                Group.id == group_id,
                Group.manager_id == user_id,
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def transfer_management(
        self,
        session: AsyncSession,
        *,
        group_id: int,
        current_manager_id: int,
        new_manager_id: int,
        updated_by: int,
    ) -> bool:
        """Передать управление группой другому участнику"""
        # Проверяем, что текущий менеджер действительно менеджер
        if not await self.is_manager(session, group_id=group_id, user_id=current_manager_id):
            logger.warning(f"User {current_manager_id} is not manager of group {group_id}")
            return False

        # Проверяем, что новый менеджер состоит в группе
        if not await self.is_member(session, group_id=group_id, user_id=new_manager_id):
            logger.warning(f"User {new_manager_id} is not a member of group {group_id}")
            return False

        # Обновляем менеджера
        group = await self.update(
            session,
            group_id,
            manager_id=new_manager_id,
            updated_by=updated_by,
        )

        return group is not None

    async def get_user_role_in_group(
        self,
        session: AsyncSession,
        *,
        group_id: int,
        user_id: int,
    ) -> str:
        """Получить роль пользователя в группе ('manager' или 'member')"""
        if await self.is_manager(session, group_id=group_id, user_id=user_id):
            return "manager"
        if await self.is_member(session, group_id=group_id, user_id=user_id):
            return "member"
        return "none"

    async def get_groups_where_manager(
            self,
            session: AsyncSession,
            user_id: int,
    ) -> List[Group]:
        """Получить все группы, где пользователь является менеджером"""
        stmt = select(Group).where(Group.manager_id == user_id)
        result = await session.execute(stmt)
        return list(result.scalars().all())


    async def get_next_potential_manager(
            self,
            session: AsyncSession,
            group_id: int,
            exclude_user_id: int,
    ) -> User | None:
        """
        Найти следующего кандидата на роль менеджера.
        Приоритет: участники, не являющиеся удаленными, сортировка по дате вступления.
        """
        stmt = (
            select(User)
            .join(UserGroup, UserGroup.user_id == User.id)
            .where(
                and_(
                    UserGroup.group_id == group_id,
                    User.id != exclude_user_id,
                    # User.is_deleted == False,  # если добавите soft delete
                )
            )
            .order_by(UserGroup.created_at.asc())  # Самый старый участник
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


    async def auto_reassign_manager(
            self,
            session: AsyncSession,
            group_id: int,
            current_manager_id: int,
    ) -> bool:
        """
        Автоматически переназначить менеджера при удалении текущего.
        Возвращает True, если удалось переназначить.
        """
        next_manager = await self.get_next_potential_manager(
            session,
            group_id,
            exclude_user_id=current_manager_id
        )

        if next_manager:
            await self.update(
                session,
                group_id,
                manager_id=next_manager.id,
                updated_by=current_manager_id,  # или system user
            )
            logger.info(f"Auto-reassigned group {group_id} to user {next_manager.id}")
            return True

        logger.warning(f"No candidate to manage group {group_id}")
        return False

    async def get_join_date(
            self,
            session: AsyncSession,
            group_id: int,
            user_id: int,
    ) -> UserGroup:
        stmt = select(UserGroup).where(
            and_(UserGroup.group_id == group_id,
                 UserGroup.user_id == user_id,)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()