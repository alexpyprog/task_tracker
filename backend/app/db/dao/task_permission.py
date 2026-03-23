from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TaskPermission
from app.db.models import TaskPermissionModel


class TaskPermissionDAO:
    async def has_permission(
            self,
            session: AsyncSession,
            task_id: str,
            user_id: int,
            permission: TaskPermission
    ) -> bool:
        """Проверяет наличие права у пользователя для задачи"""
        stmt = select(TaskPermissionModel).where(
            and_(
                TaskPermissionModel.task_id == task_id,
                TaskPermissionModel.user_id == user_id,
                TaskPermissionModel.permission == permission
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def add_permission(
            self,
            session: AsyncSession,
            task_id: str,
            user_id: int,
            permission: TaskPermission
    ) -> TaskPermissionModel:
        """Добавляет право пользователю для задачи"""
        permission_entry = TaskPermissionModel(
            task_id=task_id,
            user_id=user_id,
            permission=permission
        )
        session.add(permission_entry)
        await session.commit()
        await session.refresh(permission_entry)
        return permission_entry

    async def remove_permission(
            self,
            session: AsyncSession,
            task_id: str,
            user_id: int,
            permission: TaskPermission
    ) -> bool:
        """Удаляет право у пользователя для задачи"""
        stmt = select(TaskPermissionModel).where(
            and_(
                TaskPermissionModel.task_id == task_id,
                TaskPermissionModel.user_id == user_id,
                TaskPermissionModel.permission == permission
            )
        )
        result = await session.execute(stmt)
        permission_entry = result.scalar_one_or_none()

        if permission_entry:
            await session.delete(permission_entry)
            await session.commit()
            return True
        return False

    async def get_task_permissions(
            self,
            session: AsyncSession,
            task_id: str
    ) -> list[TaskPermissionModel]:
        """Получает все права для задачи"""
        stmt = select(TaskPermissionModel).where(
            TaskPermissionModel.task_id == task_id
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_permissions_for_task(
            self,
            session: AsyncSession,
            task_id: str,
            user_id: int
    ) -> list[TaskPermission]:
        """Получает все права пользователя для задачи"""
        stmt = select(TaskPermissionModel.permission).where(
            and_(
                TaskPermissionModel.task_id == task_id,
                TaskPermissionModel.user_id == user_id
            )
        )
        result = await session.execute(stmt)
        return [row[0] for row in result.all()]