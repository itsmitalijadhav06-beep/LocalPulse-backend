from datetime import datetime
from typing import Union
from pydantic import BaseModel, Field
from app.core.constants import NotificationType
from app.utils.helpers import get_utc_now

class NotificationModel(BaseModel):
    """
    Placeholder Database Model representing the Notification collection in MongoDB.
    """
    id: str = Field(default_factory=lambda: "ntf_" + get_utc_now().strftime("%Y%m%d%H%M%S"))
    user_id: str
    type: Union[NotificationType, str] = NotificationType.SYSTEM
    title: str
    body: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=get_utc_now)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "ntf_20260625120000",
                "user_id": "usr_123",
                "type": "issue_status_change",
                "title": "Issue Resolved",
                "body": "The pothole on Main St has been marked as resolved.",
                "is_read": False,
                "created_at": "2026-06-25T12:10:00Z"
            }
        }
