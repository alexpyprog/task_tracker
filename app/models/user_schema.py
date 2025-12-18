from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from app.core.enums import UserStatus


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., max_length=255)
    email: str = Field(..., max_length=255)
    phone: str = Field(..., max_length=30)
    user_status: UserStatus = Field(default=UserStatus.base_user)



class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    group_id: int
    organization_id: Optional[int] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=30)
    password: Optional[str] = Field(None, min_length=8)
    user_status: Optional[UserStatus] = None
    profile_photo_path: Optional[str] = None
    group_id: Optional[int] = None
    organization_id: Optional[int] = None



class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    phone: str
    profile_photo_path: Optional[str]
    verified: bool
    user_status: UserStatus

    organization_id: Optional[int]
    group_id: int

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
