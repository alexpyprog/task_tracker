from typing import Any, Generic, Type, TypeVar
from typing import AsyncIterator, cast

from sqlalchemy import inspect
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine,
    AsyncAttrs,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import Mapper

from app.core.settings import Settings
from app.logger.file_logger import CustomLogger


logger = CustomLogger("base_logger")

engine = create_async_engine(url=Settings.db_url, echo=False, pool_pre_ping=True)

async_session = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


class Base(AsyncAttrs, DeclarativeBase):
    """Базовый класс для создания моделей в БД"""

    def as_dict(self) -> dict:
        """Функция для представления записи в БД в виде словаря"""
        mapper: Mapper = cast(Mapper, inspect(self).mapper)
        return {column.key: getattr(self, column.key) for column in mapper.column_attrs}


ModelT = TypeVar("ModelT", bound=Base)


class CRUDBase(Generic[ModelT]):
    def __init__(self, model: Type[ModelT]) -> None:
        self.model = model

    async def get(
        self,
        session: AsyncSession,
        **filters: Any,
    ) -> ModelT | None:
        stmt = select(self.model).filter_by(**filters)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        session: AsyncSession,
        *,
        limit: int = 100,
        offset: int = 0,
        **filters: Any,
    ) -> list[ModelT]:
        stmt = (
            select(self.model)
            .filter_by(**filters)
            .limit(limit)
            .offset(offset)
        )
        result = await session.execute(stmt)
        return list(result.scalars())

    async def create(
        self,
        session: AsyncSession,
        **data: Any,
    ) -> ModelT:
        obj = self.model(**data)
        session.add(obj)
        await session.commit()
        await session.refresh(obj)
        return obj

    async def update(
        self,
        session: AsyncSession,
        *,
        filters: dict[str, Any],
        values: dict[str, Any],
    ) -> None:
        stmt = (
            update(self.model)
            .filter_by(**filters)
            .values(**values)
        )
        await session.execute(stmt)
        await session.commit()

    async def delete(
        self,
        session: AsyncSession,
        **filters: Any,
    ) -> None:
        stmt = delete(self.model).filter_by(**filters)
        await session.execute(stmt)
        await session.commit()
