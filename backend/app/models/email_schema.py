from pydantic import BaseModel, Field


class EmailVerificationRequest(BaseModel):
    email: str = Field(..., max_length=255)


class EmailVerificationResponse(BaseModel):
    message: str
    email: str


class TokenVerificationRequest(BaseModel):
    token: str = Field(..., min_length=32, max_length=36)


class TokenVerificationResponse(BaseModel):
    verified: bool
    message: str