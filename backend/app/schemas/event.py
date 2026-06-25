from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class EventCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    event_date: datetime
    location_address: str = Field(..., min_length=5)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    max_attendees: Optional[int] = Field(None, ge=1)

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    location_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    max_attendees: Optional[int] = None

class EventResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int
    title: str
    description: str
    organizer_id: int
    organizer_name: str
    event_date: datetime
    location_address: str
    latitude: float
    longitude: float
    attendees: List[int]
    max_attendees: Optional[int]
    created_at: datetime
    updated_at: datetime
