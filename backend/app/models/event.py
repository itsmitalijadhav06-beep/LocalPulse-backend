from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.utils.helpers import get_utc_now

class EventModel(BaseModel):
    """
    Placeholder Database Model representing the Event collection in MongoDB.
    """
    id: str = Field(default_factory=lambda: "evt_" + get_utc_now().strftime("%Y%m%d%H%M%S"))
    title: str
    description: str
    organizer_id: str
    organizer_name: str
    event_date: datetime
    location_address: str
    latitude: float
    longitude: float
    attendees: List[str] = Field(default_factory=list)
    max_attendees: Optional[int] = None
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "evt_20260625120000",
                "title": "Central Park Cleanup Event",
                "description": "Weekly gathering to clean up litter in the central lawn.",
                "organizer_id": "usr_456",
                "organizer_name": "Eco Friends NGO",
                "event_date": "2026-06-27T10:00:00Z",
                "location_address": "Central Park East Gate",
                "latitude": 40.785091,
                "longitude": -73.968285,
                "attendees": ["usr_123", "usr_789"],
                "created_at": "2026-06-25T12:00:00Z"
            }
        }
