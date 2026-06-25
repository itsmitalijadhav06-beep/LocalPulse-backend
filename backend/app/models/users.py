from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from app.core.constants import UserRole
from app.utils.helpers import get_utc_now

class UserModel(BaseModel):
    """
    Database Model representing the User collection in MongoDB.
    """
    id: str = Field(default_factory=lambda: "usr_" + datetime.utcnow().strftime("%Y%m%d%H%M%S"))
    email: EmailStr
    hashed_password: str
    full_name: str
    role: UserRole = UserRole.CITIZEN
    phone_number: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "usr_20260625120000",
                "email": "citizen@localpulse.org",
                "full_name": "Jane Doe",
                "role": "citizen",
                "phone_number": "+1234567890",
                "is_active": True,
                "created_at": "2026-06-25T12:00:00Z"
            }
        }
