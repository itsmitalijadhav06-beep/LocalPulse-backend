import logging
from typing import List
from datetime import datetime, timezone
from app.schemas.notification import NotificationResponse
from app.core.constants import NotificationType
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

class NotificationService:
    """
    Placeholder service for distributing and managing user notifications.
    """
    @classmethod
    async def send_notification(
        cls, 
        user_id: str, 
        type: NotificationType, 
        title: str, 
        body: str
    ) -> NotificationResponse:
        logger.info(f"NotificationService: Dispatching '{type.value}' alert to user {user_id}: '{title}'")
        return NotificationResponse(
            id="ntf_mock123",
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            is_read=False,
            created_at=datetime.now(timezone.utc)
        )

    @classmethod
    async def list_user_notifications(
        cls, 
        user_id: str, 
        limit: int = 10, 
        skip: int = 0
    ) -> List[NotificationResponse]:
        logger.info(f"NotificationService: Listing notifications for user {user_id} (limit={limit})")
        return [
            NotificationResponse(
                id="ntf_mock1",
                user_id=user_id,
                type=NotificationType.ISSUE_STATUS_CHANGE,
                title="Pothole report update",
                body="An inspector has been assigned to verify the issue.",
                is_read=False,
                created_at=datetime.now(timezone.utc)
            )
        ]

    @classmethod
    async def mark_as_read(cls, notification_id: str, user_id: str) -> bool:
        logger.info(f"NotificationService: Marking alert {notification_id} as read for user {user_id}")
        return True
