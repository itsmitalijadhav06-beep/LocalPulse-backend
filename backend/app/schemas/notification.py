from datetime import datetime
from typing import Union
from pydantic import BaseModel, ConfigDict
from app.core.constants import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int
    user_id: int
    type: Union[NotificationType, str]
    title: str
    body: str
    is_read: bool
    created_at: datetime
