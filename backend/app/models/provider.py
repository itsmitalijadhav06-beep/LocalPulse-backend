from datetime import datetime
from typing import List, Dict, Any, Union
from pydantic import BaseModel, Field
from app.core.constants import ProviderCategory
from app.utils.helpers import get_utc_now

class ProviderModel(BaseModel):
    """
    Placeholder Database Model representing the Provider collection in MongoDB.
    """
    id: str = Field(default_factory=lambda: "prv_" + datetime.utcnow().strftime("%Y%m%d%H%M%S"))
    name: str
    user_id: str  # Associated user account
    category: Union[ProviderCategory, str] = ProviderCategory.OTHER
    contact_email: str
    contact_phone: str
    service_radius_km: float = 10.0
    latitude: float
    longitude: float
    assigned_issues: List[str] = Field(default_factory=list)
    rating: float = 5.0
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "prv_20260625120000",
                "name": "Metro Pothole Repair Corp",
                "user_id": "usr_999",
                "category": "infrastructure",
                "contact_email": "info@metropothole.com",
                "contact_phone": "+1999888777",
                "service_radius_km": 15.0,
                "latitude": 40.7128,
                "longitude": -74.0060,
                "assigned_issues": ["iss_1", "iss_2"],
                "rating": 4.8,
                "created_at": "2026-06-25T12:00:00Z"
            }
        }
