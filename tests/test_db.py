import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User, Task
from app.core.enums import TaskStatus


class TestDatabase:
    """Тесты базы данных и моделей"""

    @pytest.mark.asyncio
    async def test_create_user(self, db_session: AsyncSession):
        """Создание пользователя в БД"""
        user = User(
            username="dbuser",
            full_name="Database User",
            email="dbuser@example.com",
            phone="+79991112233",
            hashed_password=b"hashed_password",
            verified=True
        )

        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user.id is not None
        assert user.username == "dbuser"
        assert user.created_at is not None

    @pytest.mark.asyncio
    async def test_user_password_verification(self):
        """Проверка хеширования пароля"""
        from app.utils.pwd_utils import hash_password, verify_password

        password = "testpassword"
        hashed = hash_password(password)

        # Правильный пароль
        assert verify_password(password, hashed) is True

        # Неправильный пароль
        assert verify_password("wrongpassword", hashed) is False

    @pytest.mark.asyncio
    async def test_create_task(self, db_session: AsyncSession, test_user):
        """Создание задачи в БД"""
        task = Task(
            id="test-task-id",
            title="Database Task",
            description="Task created in DB test",
            created_by=test_user.id,
            worker_id=test_user.id,
            status=TaskStatus.created
        )

        db_session.add(task)
        await db_session.commit()
        await db_session.refresh(task)

        assert task.id == "test-task-id"
        assert task.title == "Database Task"
        assert task.status == TaskStatus.created
        assert task.created_at is not None

    @pytest.mark.asyncio
    async def test_task_user_relationship(self, db_session: AsyncSession, test_user):
        """Тест связи задачи и пользователя"""
        # Создаем задачу
        task = Task(
            id="relationship-task",
            title="Relationship Test",
            created_by=test_user.id,
            worker_id=test_user.id
        )

        db_session.add(task)
        await db_session.commit()

        # Проверяем, что можем получить задачу по ID
        result = await db_session.execute(
            select(Task).where(Task.id == "relationship-task")
        )
        fetched_task = result.scalar_one()

        assert fetched_task is not None
        assert fetched_task.created_by == test_user.id
        # Можно добавить relationships когда они будут

    @pytest.mark.asyncio
    async def test_transaction_rollback(self, db_session: AsyncSession):
        """Тест отката транзакции"""
        # Создаем пользователя
        user = User(
            username="rollback_user",
            full_name="Rollback Test",
            email="rollback@example.com",
            phone="+79994445566",
            hashed_password=b"hash"
        )

        db_session.add(user)
        await db_session.flush()  # Сохраняем, но не коммитим

        # Проверяем, что у пользователя есть ID
        assert user.id is not None

        # Откатываем транзакцию
        await db_session.rollback()

        # Проверяем, что пользователь не сохранился
        result = await db_session.execute(
            select(User).where(User.username == "rollback_user")
        )
        user_after_rollback = result.scalar_one_or_none()

        assert user_after_rollback is None

    @pytest.mark.asyncio
    async def test_unique_constraint_username(self, db_session: AsyncSession):
        """Тест уникальности username"""
        user1 = User(
            username="unique_user",
            full_name="User One",
            email="user1@example.com",
            phone="+79997778899",
            hashed_password=b"hash1"
        )

        user2 = User(
            username="unique_user",  # Тот же username
            full_name="User Two",
            email="user2@example.com",
            phone="+79996667788",
            hashed_password=b"hash2"
        )

        db_session.add(user1)
        await db_session.commit()

        db_session.add(user2)

        # Должна быть ошибка уникальности
        with pytest.raises(Exception) as exc_info:
            await db_session.commit()

        assert "unique" in str(exc_info.value).lower()