from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

from app.core.enums import TaskStatus


class TaskBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: str


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None


class TaskOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None  # <- теперь None допустимо
    status: str

    model_config = ConfigDict(from_attributes=True)
