import uuid
from datetime import datetime

from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Boolean, Enum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import UserStatus, TaskStatus, ContentTypes, TaskPermission, LogLevel
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    username: Mapped[str] = mapped_column(String, unique=True)
    full_name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String)
    phone: Mapped[str] = mapped_column(String)
    hashed_password: Mapped[str] = mapped_column(String)
    profile_photo_path: Mapped[str] = mapped_column(String, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id"),
        nullable=True
    )
    group_id: Mapped[int] = mapped_column(Integer, ForeignKey("groups.id"))
    user_status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.base_user)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())


class Task(Base):
    __tablename__ = 'tasks'

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    title: Mapped[str] = mapped_column(String, nullable=False, default='New task')
    description: Mapped[str] = mapped_column(String, nullable=True)
    deadline: Mapped[DateTime] = mapped_column(DateTime, nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    worker_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.created)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class Organization(Base):
    __tablename__ = 'organizations'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String, nullable=False, default='New organization')
    director_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class Group(Base):
    __tablename__ = 'groups'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String, nullable=False, default='New group')
    manager_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey('organizations.id'), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class TaskHistory(Base):
    __tablename__ = 'tasks_history'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    task_id: Mapped[int] = mapped_column(Integer, ForeignKey('tasks.id'))
    old_status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))
    new_status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))

    changed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=func.now())
    changed_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class FileAttachment(Base):
    __tablename__ = 'file_attachments'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    task_id: Mapped[int] = mapped_column(Integer, ForeignKey('tasks.id'))
    filename: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[str] = mapped_column(Enum(ContentTypes), nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class Notification(Base):
    __tablename__ = 'notifications'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    recipient_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    message: Mapped[str] = mapped_column(String, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)


class TaskPermissionModel(Base):
    __tablename__ = "task_permissions"

    id: Mapped[int] = mapped_column(primary_key=True)

    task_id: Mapped[str] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True
    )
    permission: Mapped[TaskPermission] = mapped_column(
        Enum(TaskPermission),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint("task_id", "user_id", "permission"),
    )


class ApplicationLog(Base):
    __tablename__ = "application_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    level: Mapped[LogLevel] = mapped_column(Enum(LogLevel), nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )
    entity: Mapped[str | None] = mapped_column(String, nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=func.now()
    )


class TaskComment(Base):
    __tablename__ = "task_comments"

    id: Mapped[int] = mapped_column(primary_key=True)

    task_id: Mapped[str] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        index=True
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True
    )
    text: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=func.now()
    )


class SubTask(Base):
    __tablename__ = "subtasks"

    id: Mapped[int] = mapped_column(primary_key=True)

    task_id: Mapped[str] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=func.now()
    )


class TaskTemplate(Base):
    __tablename__ = "task_templates"

    id: Mapped[int] = mapped_column(primary_key=True)

    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        nullable=True
    )

    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=func.now()
    )
