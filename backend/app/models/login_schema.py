from pydantic import BaseModel, Field


class UserLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=255)



class TokenPairOut(BaseModel):
    access_token: str = Field(...)
    refresh_token: str = Field(...)
    token_type: str = Field(default="bearer")