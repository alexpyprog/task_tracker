from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.core.enums import InvitationStatus


class InvitationCreate(BaseModel):
    to_user_id: int | None = None
    email: str | None = None
    group_id: int
    message: str | None = None


class InvitationOut(BaseModel):
    id: str
    from_user: int
    to_user: int
    group_id: int
    status: InvitationStatus
    message: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)