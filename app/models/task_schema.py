from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.core.enums import TaskStatus


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    worker_id: int
    status: TaskStatus = TaskStatus.created

class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    worker_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    updated_by: Optional[int] = None


class TaskOut(TaskBase):
    id: str
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class TaskListOut(BaseModel):
    id: str
    title: str
    status: TaskStatus
    deadline: Optional[datetime] = None
    created_at: datetime
    worker_id: int
    created_by: int

    model_config = ConfigDict(from_attributes=True)


class TaskFilter(BaseModel):
    status: Optional[TaskStatus] = None
    worker_id: Optional[int] = None
    created_by: Optional[int] = None