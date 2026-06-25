from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.core.constants import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: str
    user_id: str
    type: NotificationType
    title: str
    body: str
    is_read: bool
    created_at: datetime
