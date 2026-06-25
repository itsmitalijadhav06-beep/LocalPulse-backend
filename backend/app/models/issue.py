from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.core.constants import IssueStatus
from app.utils.helpers import get_utc_now

class IssueModel(BaseModel):
    """
    Placeholder Database Model representing the Issue collection in MongoDB.
    """
    id: str = Field(default_factory=lambda: "iss_" + datetime.utcnow().strftime("%Y%m%d%H%M%S"))
    title: str
    description: str
    category: str
    status: IssueStatus = IssueStatus.REPORTED
    reporter_id: str
    assigned_provider_id: Optional[str] = None
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    upvotes: int = 0
    subscribers: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "iss_20260625120000",
                "title": "Pothole on Main St",
                "description": "Large pothole blocking the left lane near the post office.",
                "category": "roadworks",
                "status": "reported",
                "reporter_id": "usr_123",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "image_url": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
                "upvotes": 5,
                "created_at": "2026-06-25T12:00:00Z"
            }
        }
