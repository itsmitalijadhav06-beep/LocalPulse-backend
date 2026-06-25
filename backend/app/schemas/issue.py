from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.core.constants import IssueStatus

class IssueCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    category: str = Field(..., description="e.g. roads, sanitation, power")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    image_url: Optional[str] = None

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[IssueStatus] = None
    assigned_provider_id: Optional[str] = None
    image_url: Optional[str] = None

class IssueResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: str
    title: str
    description: str
    category: str
    status: IssueStatus
    reporter_id: str
    assigned_provider_id: Optional[str] = None
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    upvotes: int
    subscribers: List[str]
    created_at: datetime
    updated_at: datetime
