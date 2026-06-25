from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from app.core.constants import ProviderCategory

class ProviderCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: Union[ProviderCategory, str]
    contact_email: EmailStr
    contact_phone: str
    service_radius_km: float = Field(default=10.0, ge=0.5, le=100.0)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Union[ProviderCategory, str]] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    service_radius_km: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ProviderResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int
    name: str
    user_id: int
    category: Union[ProviderCategory, str]
    contact_email: EmailStr
    contact_phone: str
    service_radius_km: float
    latitude: float
    longitude: float
    assigned_issues: List[int]
    rating: float
    created_at: datetime
    updated_at: datetime
