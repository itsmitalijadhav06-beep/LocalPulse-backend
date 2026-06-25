from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.core.constants import UserRole

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.CITIZEN
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        # Ensure datetime fields are serialized to ISO 8601 strings
        # when model_dump(mode='json') or jsonable_encoder() is used.
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    phone_number: Optional[str] = None
    is_active: bool
    created_at: datetime
