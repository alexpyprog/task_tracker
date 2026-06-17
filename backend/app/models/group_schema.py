from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class GroupBase(BaseModel):
    name: str
    description: str = "Description here"

    model_config = ConfigDict(from_attributes=True)


class GroupCreate(GroupBase):
    pass


class GroupUpdate(GroupBase):
    pass


class GroupOut(GroupBase):
    id: int
    manager_id: int



class TransferRequest(BaseModel):
    new_manager_id: int


class GroupListOut(GroupOut):
    created_at: datetime
    members_count: int
    tasks_count: int
    icon: Optional[str]