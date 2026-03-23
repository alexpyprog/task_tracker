import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.enums import TaskPermission
from app.db.models import User, TaskPermissionModel
from main import app
from app.db.base import get_db, Base
from app.utils.jwt_utils import create_access_token
from tests.factories import UserFactory, TaskFactory

# Тестовая база данных (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Создание event loop для асинхронных тестов"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def engine():
    """Движок для тестовой БД"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Создаем таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Удаляем таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Сессия БД для тестов"""
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session


@pytest.fixture
def override_get_db(db_session: AsyncSession):
    """Переопределение зависимости get_db"""

    async def _override_get_db():
        yield db_session

    return _override_get_db


@pytest.fixture
async def async_client(override_get_db) -> AsyncGenerator[AsyncClient, None]:
    """Асинхронный HTTP клиент"""
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Создание тестового пользователя"""
    user = UserFactory()
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    user_raw =  await db_session.execute(select(User).where(User.username == user.username))
    user = user_raw.scalar_one_or_none()
    return user


@pytest.fixture
def auth_token(test_user):
    """JWT токен для тестового пользователя"""
    return create_access_token(test_user.id)


@pytest.fixture
async def auth_headers(auth_token):
    """Заголовки с авторизацией"""
    return {
        "accept": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }


@pytest.fixture
async def authenticated_client(async_client, auth_headers):
    """Клиент с авторизацией"""
    async_client.headers.update(auth_headers)
    return async_client


@pytest.fixture
async def test_task(db_session: AsyncSession, test_user):
    """Создание тестовой задачи"""
    task = TaskFactory(created_by=test_user.id, worker_id=test_user.id)
    db_session.add(task)
    permission = TaskPermissionModel(
        task_id=task.id,
        user_id=test_user.id,
        permission=TaskPermission.view
    )
    permission2 = TaskPermissionModel(
        task_id=task.id,
        user_id=test_user.id,
        permission=TaskPermission.edit
    )
    permission3 = TaskPermissionModel(
        task_id=task.id,
        user_id=test_user.id,
        permission=TaskPermission.delete
    )
    permission4 = TaskPermissionModel(
        task_id=task.id,
        user_id=test_user.id,
        permission=TaskPermission.change_status
    )
    db_session.add(permission)
    db_session.add(permission2)
    db_session.add(permission3)
    db_session.add(permission4)
    await db_session.commit()
    await db_session.refresh(task)
    await db_session.refresh(permission)
    await db_session.refresh(permission2)
    await db_session.refresh(permission3)
    await db_session.refresh(permission4)
    return task