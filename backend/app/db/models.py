import uuid
from datetime import datetime
from typing import List

from sqlalchemy import String, Integer, ForeignKey, DateTime, func, Boolean, Enum, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserStatus, TaskStatus, ContentTypes, TaskPermission, LogLevel, InvitationStatus
from app.db.base import Base


class User(Base):  # Done
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    username: Mapped[str] = mapped_column(String, unique=True)
    full_name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True)
    phone: Mapped[str] = mapped_column(String, unique=True)
    hashed_password: Mapped[bytes] = mapped_column()
    profile_photo_path: Mapped[str] = mapped_column(String, nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)

    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id"),
        nullable=True
    )

    groups: Mapped[List["Group"]] = relationship(
        "Group",
        secondary="user_groups",
        back_populates="users",
        lazy="selectin"
    )

    user_status: Mapped[UserStatus] = mapped_column(Enum(UserStatus), default=UserStatus.base_user)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())


class UserGroup(Base):
    __tablename__ = "user_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE")
    )
    group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("groups.id", ondelete="CASCADE"),
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True, default=func.now())


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True
    )
    from_user: Mapped[int] = mapped_column(Integer)
    to_user: Mapped[int] = mapped_column(Integer)
    group_id: Mapped[int] = mapped_column(Integer)
    status: Mapped[InvitationStatus] = mapped_column(Enum(InvitationStatus))
    message: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class Task(Base):
    __tablename__ = 'tasks'

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )

    title: Mapped[str] = mapped_column(String, nullable=False, default='New task')
    description: Mapped[str] = mapped_column(String, nullable=True)
    deadline: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    worker_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.created)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    updated_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=True)


class EmailConfirmation(Base):
    __tablename__ = "email_confirmations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    new_email: Mapped[str | None] = mapped_column(String, nullable=True)  # для смены email

    # Добавляем timezone=True
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now()
    )

    __table_args__ = (
        Index("ix_email_confirmations_expires_at", expires_at),
    )


class Organization(Base):
    __tablename__ = 'organizations'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String, nullable=False, default='New organization')
    director_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class Group(Base):
    __tablename__ = 'groups'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String, nullable=False, default='New group')
    description: Mapped[str] = mapped_column(String, nullable=False, default='New group')
    manager_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    organization_id: Mapped[int] = mapped_column(Integer, ForeignKey('organizations.id'), nullable=True)

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary="user_groups",
        back_populates="groups",
        lazy="selectin"
    )
    icon: Mapped[str] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class TaskHistory(Base):
    __tablename__ = 'tasks_history'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    task_id: Mapped[str] = mapped_column(String, ForeignKey('tasks.id'))
    old_status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))
    new_status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus))

    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now())
    changed_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class FileAttachment(Base):
    __tablename__ = 'file_attachments'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    task_id: Mapped[str] = mapped_column(String, ForeignKey('tasks.id'))
    filename: Mapped[str] = mapped_column(String, nullable=False)
    content_type: Mapped[str] = mapped_column(Enum(ContentTypes), nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_by: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))


class Notification(Base):
    __tablename__ = 'notifications'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    recipient_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    message: Mapped[str] = mapped_column(String, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)


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
        DateTime(timezone=True),
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
        DateTime(timezone=True),
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
        DateTime(timezone=True),
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
        DateTime(timezone=True),
        nullable=False,
        default=func.now()
    )
