from datetime import datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import select, update, delete, and_, or_, func, result_tuple
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import TaskStatus, UserStatus
from app.db.models import Task, User, TaskHistory, TaskComment, SubTask
from app.logger.file_logger import CustomLogger
from app.models.task_schema import TaskFilter

logger = CustomLogger('task_dao')


class TaskDAO:
    # ---------- get ----------

    async def get_by_id(
            self,
            session: AsyncSession,
            task_id: str,
    ) -> Task | None:
        stmt = select(Task).where(Task.id == task_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_list(
            self,
            session: AsyncSession,
            skip: int = 0,
            limit: int = 100,
            filters: Optional[TaskFilter] = None
    ) -> List[Task]:
        stmt = select(Task)

        if filters:
            conditions = []
            if filters.status:
                conditions.append(Task.status == filters.status)
            if filters.worker_id:
                conditions.append(Task.worker_id == filters.worker_id)
            if filters.created_by:
                conditions.append(Task.created_by == filters.created_by)

            if conditions:
                stmt = stmt.where(and_(*conditions))

        stmt = stmt.offset(skip).limit(limit).order_by(Task.created_at.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_worker(
            self,
            session: AsyncSession,
            worker_id: int,
            skip: int = 0,
            limit: int = 100,
            status: Optional[TaskStatus] = None
    ) -> List[Task]:
        stmt = select(Task).where(Task.worker_id == worker_id)

        if status:
            stmt = stmt.where(Task.status == status)

        stmt = stmt.offset(skip).limit(limit).order_by(Task.created_at.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_creator(
            self,
            session: AsyncSession,
            creator_id: int,
            skip: int = 0,
            limit: int = 100,
            status: Optional[TaskStatus] = None
    ) -> List[Task]:
        stmt = select(Task).where(Task.created_by == creator_id)

        if status:
            stmt = stmt.where(Task.status == status)

        stmt = stmt.offset(skip).limit(limit).order_by(Task.created_at.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_overdue(
            self,
            session: AsyncSession,
            skip: int = 0,
            limit: int = 100
    ) -> List[Task]:
        stmt = (
            select(Task)
            .where(
                and_(
                    Task.deadline.is_not(None),
                    Task.deadline < datetime.now(),
                    Task.status.not_in([TaskStatus.completed, TaskStatus.cancelled])
                )
            )
            .offset(skip)
            .limit(limit)
            .order_by(Task.deadline)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def search(
            self,
            session: AsyncSession,
            query: str,
            skip: int = 0,
            limit: int = 100,
            user_id: Optional[int] = None
    ) -> List[Task]:
        """Поиск задач по названию и описанию"""
        search_pattern = f"%{query}%"
        stmt = select(Task).where(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern)
            )
        )

        if user_id:
            stmt = stmt.where(
                or_(
                    Task.created_by == user_id,
                    Task.worker_id == user_id
                )
            )

        stmt = stmt.offset(skip).limit(limit).order_by(Task.created_at.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def get_user_stats(
            self,
            session: AsyncSession,
            user_id: int
    ) -> Dict[str, Any]:
        """Получить статистику по задачам для пользователя"""
        # Общее количество задач
        total_stmt = select(func.count()).select_from(Task).where(
            or_(
                Task.created_by == user_id,
                Task.worker_id == user_id
            )
        )
        total_result = await session.execute(total_stmt)
        total = total_result.scalar() or 0

        # Задачи по статусам
        status_stmt = (
            select(Task.status, func.count())
            .where(
                or_(
                    Task.created_by == user_id,
                    Task.worker_id == user_id
                )
            )
            .group_by(Task.status)
        )
        status_result = await session.execute(status_stmt)
        status_counts = dict(status_result.scalars().all())

        # Просроченные задачи
        overdue_stmt = select(func.count()).select_from(Task).where(
            and_(
                Task.deadline.is_not(None),
                Task.deadline < datetime.now(),
                Task.status.not_in([TaskStatus.completed, TaskStatus.cancelled]),
                or_(
                    Task.created_by == user_id,
                    Task.worker_id == user_id
                )
            )
        )
        overdue_result = await session.execute(overdue_stmt)
        overdue = overdue_result.scalar() or 0

        return {
            "total_tasks": total,
            "status_counts": status_counts,
            "overdue_tasks": overdue
        }

    async def get_by_group_id(
            self,
            session: AsyncSession,
            group_id: int,
            user_id: Optional[int],
    ):
        stmt = select(Task)
        if user_id:
            stmt = stmt.where(
                and_(
                    Task.group_id == group_id,
                    Task.worker_id == user_id
                )
            )
        else:
            stmt = stmt.where(
                Task.group_id == group_id
            )
        result = await session.execute(stmt)
        return result.scalars().all()

    # ---------- create ----------

    async def create(
            self,
            session: AsyncSession,
            *,
            title: str,
            description: Optional[str] = None,
            deadline: Optional[datetime] = None,
            created_by: int,
            worker_id: int,
            group_id: Optional[int] = None,
            status: TaskStatus = TaskStatus.created
    ) -> Task:
        task = Task(
            title=title,
            description=description,
            deadline=deadline,
            created_by=created_by,
            worker_id=worker_id,
            status=status,
            group_id=group_id,
        )
        session.add(task)
        await session.commit()
        await session.refresh(task)

        # Логируем создание
        logger.info(f"Task created: {task.id} by user {created_by}")
        return task

    async def create_from_dict(
            self,
            session: AsyncSession,
            data: Dict[str, Any]
    ) -> Optional[Task]:
        """Создать задачу из словаря данных"""
        try:
            task = Task(**data)
            session.add(task)
            await session.commit()
            await session.refresh(task)
            return task
        except SQLAlchemyError as e:
            logger.error(f'{e}')
            await session.rollback()
            return None

    # ---------- update ----------

    async def update(
            self,
            session: AsyncSession,
            task_id: str,
            data: Dict[str, Any]
    ) -> Task | None:
        """Обновить задачу"""
        # Проверяем, что есть что обновлять
        if not data:
            return None

        # Добавляем updated_by и updated_at
        if 'updated_by' in data:
            data['updated_at'] = datetime.now()

        stmt = (
            update(Task)
            .where(Task.id == task_id)
            .values(**data)
            .returning(Task)
        )
        result = await session.execute(stmt)
        await session.commit()
        updated_task = result.scalar_one_or_none()

        if updated_task:
            await session.refresh(updated_task)
            logger.info(f"Task updated: {task_id}")

        return updated_task

    async def update_task(
            self,
            session: AsyncSession,
            *,
            task_id: str,
            title: Optional[str] = None,
            description: Optional[str] = None,
            deadline: Optional[datetime] = None,
            status: Optional[TaskStatus] = None,
            updated_by: Optional[int] = None,
    ) -> Task | None:
        values = {}

        if title is not None:
            values["title"] = title
        if description is not None:
            values["description"] = description
        if deadline is not None:
            values["deadline"] = deadline
        if status is not None:
            values["status"] = status
        if updated_by is not None:
            values["updated_by"] = updated_by

        if not values:
            return None

        values["updated_at"] = datetime.now()
        return await self.update(session, task_id, values)

    async def update_status(
            self,
            session: AsyncSession,
            task_id: str,
            new_status: TaskStatus,
            changed_by: int
    ) -> Task | None:
        """Обновить статус задачи с записью в историю"""
        # Получаем текущую задачу
        task = await self.get_by_id(session, task_id)
        if not task:
            return None

        old_status = task.status

        # Обновляем статус
        updated_task = await self.update(
            session,
            task_id,
            {
                "status": new_status,
                "updated_by": changed_by,
                "updated_at": datetime.now()
            }
        )

        if updated_task:
            # Записываем в историю
            history_entry = TaskHistory(
                task_id=task_id,
                old_status=old_status,
                new_status=new_status,
                changed_by=changed_by
            )
            session.add(history_entry)
            await session.commit()

            logger.info(
                f"Task status changed: {task_id} "
                f"from {old_status} to {new_status} by user {changed_by}"
            )

        return updated_task

    async def assign_worker(
            self,
            session: AsyncSession,
            task_id: str,
            worker_id: int,
            updated_by: int
    ) -> Task | None:
        """Назначить задачу другому исполнителю"""
        return await self.update(
            session,
            task_id,
            {
                "worker_id": worker_id,
                "updated_by": updated_by,
                "updated_at": datetime.now()
            }
        )

    # ---------- delete ----------

    async def delete(
            self,
            session: AsyncSession,
            *,
            task_id: str
    ) -> bool:
        try:
            stmt = delete(Task).where(Task.id == task_id)
            await session.execute(stmt)
            await session.commit()
            logger.info(f"Task deleted: {task_id}")
            return True
        except SQLAlchemyError as e:
            logger.error(f'Error deleting task {task_id}: {e}')
            return False

    # ---------- permissions & checks ----------

    async def user_exists(
            self,
            session: AsyncSession,
            user_id: int
    ) -> bool:
        """Проверяет, существует ли пользователь"""
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def can_change_status(
            self,
            session: AsyncSession,
            task_id: str,
            user_id: int
    ) -> bool:
        """Проверяет, может ли пользователь изменить статус задачи"""
        stmt = select(Task).where(Task.id == task_id)
        result = await session.execute(stmt)
        task = result.scalar_one_or_none()

        if not task:
            return False

        # Создатель, исполнитель или админ могут менять статус
        return (
                task.created_by == user_id or
                task.worker_id == user_id or
                await self.is_admin(session, user_id)
        )

    async def can_assign(
            self,
            session: AsyncSession,
            task_id: str,
            user_id: int
    ) -> bool:
        """Проверяет, может ли пользователь переназначить задачу"""
        stmt = select(Task).where(Task.id == task_id)
        result = await session.execute(stmt)
        task = result.scalar_one_or_none()

        if not task:
            return False

        # Только создатель задачи или админ может переназначать
        return (
                task.created_by == user_id or
                await self.is_admin(session, user_id)
        )

    async def is_admin(
            self,
            session: AsyncSession,
            user_id: int
    ) -> bool:
        """Проверяет, является ли пользователь админом"""
        stmt = select(User).where(
            and_(
                User.id == user_id,
                User.user_status == UserStatus.admin
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None

    # ---------- comments ----------

    async def add_comment(
            self,
            session: AsyncSession,
            task_id: str,
            author_id: int,
            text: str
    ) -> TaskComment:
        """Добавить комментарий к задаче"""
        comment = TaskComment(
            task_id=task_id,
            author_id=author_id,
            text=text
        )
        session.add(comment)
        await session.commit()
        await session.refresh(comment)
        return comment

    async def get_comments(
            self,
            session: AsyncSession,
            task_id: str,
            skip: int = 0,
            limit: int = 100
    ) -> List[TaskComment]:
        """Получить комментарии задачи"""
        stmt = (
            select(TaskComment)
            .where(TaskComment.task_id == task_id)
            .order_by(TaskComment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    # ---------- subtasks ----------

    async def add_subtask(
            self,
            session: AsyncSession,
            task_id: str,
            title: str
    ) -> SubTask:
        """Добавить подзадачу"""
        subtask = SubTask(
            task_id=task_id,
            title=title
        )
        session.add(subtask)
        await session.commit()
        await session.refresh(subtask)
        return subtask

    async def get_subtasks(
            self,
            session: AsyncSession,
            task_id: str
    ) -> List[SubTask]:
        """Получить подзадачи"""
        stmt = (
            select(SubTask)
            .where(SubTask.task_id == task_id)
            .order_by(SubTask.created_at)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def update_subtask_status(
            self,
            session: AsyncSession,
            subtask_id: int,
            is_done: bool
    ) -> SubTask | None:
        """Обновить статус подзадачи"""
        stmt = (
            update(SubTask)
            .where(SubTask.id == subtask_id)
            .values(is_done=is_done)
            .returning(SubTask)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.scalar_one_or_none()

    # ---------- history ----------

    async def get_history(
            self,
            session: AsyncSession,
            task_id: str,
            skip: int = 0,
            limit: int = 100
    ) -> List[TaskHistory]:
        """Получить историю изменений задачи"""
        stmt = (
            select(TaskHistory)
            .where(TaskHistory.task_id == task_id)
            .order_by(TaskHistory.changed_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())

    # ---------- utility ----------

    async def count_tasks(
            self,
            session: AsyncSession,
            filters: Optional[TaskFilter] = None
    ) -> int:
        """Подсчитать количество задач с фильтрами"""
        stmt = select(func.count()).select_from(Task)

        if filters:
            conditions = []
            if filters.status:
                conditions.append(Task.status == filters.status)
            if filters.worker_id:
                conditions.append(Task.worker_id == filters.worker_id)
            if filters.created_by:
                conditions.append(Task.created_by == filters.created_by)

            if conditions:
                stmt = stmt.where(and_(*conditions))

        result = await session.execute(stmt)
        return result.scalar() or 0