import logging
from typing import List
from datetime import datetime, timezone
from bson import ObjectId
from app.schemas.notification import NotificationResponse
from app.core.constants import NotificationType
from app.core.config import settings
from app.core.database import db_client

logger = logging.getLogger(settings.PROJECT_NAME)

class NotificationService:
    """
    Service for distributing and managing user notifications using MongoDB.
    """
    @classmethod
    async def _map_notification_to_response(cls, saved_notification: dict) -> NotificationResponse:
        # Resolve user_id (user)
        user_id = 0
        u_val = saved_notification.get("user_id")
        if u_val:
            try:
                u_obj_id = ObjectId(u_val) if isinstance(u_val, str) else u_val
                user_doc = await db_client.db.users.find_one({"_id": u_obj_id}, {"user_id": 1})
                if user_doc:
                    user_id = user_doc.get("user_id", 0)
            except Exception:
                pass

        return NotificationResponse(
            id=saved_notification["notification_id"],
            user_id=user_id,
            type=saved_notification["type"],
            title=saved_notification["title"],
            body=saved_notification["body"],
            is_read=saved_notification.get("is_read", False),
            created_at=saved_notification["created_at"]
        )

    @classmethod
    async def send_notification(
        cls, 
        user_id: str, 
        type: NotificationType, 
        title: str, 
        body: str
    ) -> NotificationResponse:
        logger.info(f"NotificationService: Dispatching '{type.value}' alert to user {user_id}: '{title}'")
        
        user_obj_id = None
        if isinstance(user_id, int) or (isinstance(user_id, str) and user_id.isdigit()):
            user_doc = await db_client.db.users.find_one({"user_id": int(user_id)})
            if user_doc:
                user_obj_id = user_doc["_id"]
        elif isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_obj_id = ObjectId(user_id)
            
        if not user_obj_id:
            raise ValueError("User not found.")

        from app.core.database import get_next_sequence_value
        notification_id = await get_next_sequence_value("notifications")

        notification_document = {
            "notification_id": notification_id,
            "user_id": user_obj_id,
            "type": type.value if hasattr(type, "value") else type,
            "title": title,
            "body": body,
            "is_read": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        result = await db_client.db.notifications.insert_one(notification_document)
        saved_notification = await db_client.db.notifications.find_one({"_id": result.inserted_id})
        return await cls._map_notification_to_response(saved_notification)

    @classmethod
    async def list_user_notifications(
        cls, 
        user_id: str, 
        limit: int = 10, 
        skip: int = 0
    ) -> List[NotificationResponse]:
        logger.info(f"NotificationService: Listing notifications for user {user_id} (limit={limit})")
        
        user_obj_id = None
        if isinstance(user_id, int) or (isinstance(user_id, str) and user_id.isdigit()):
            user_doc = await db_client.db.users.find_one({"user_id": int(user_id)})
            if user_doc:
                user_obj_id = user_doc["_id"]
        elif isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_obj_id = ObjectId(user_id)
            
        if not user_obj_id:
            return []
            
        cursor = db_client.db.notifications.find({"user_id": user_obj_id}).skip(skip).limit(limit)
        notifications = []
        async for saved_notification in cursor:
            notifications.append(await cls._map_notification_to_response(saved_notification))
        return notifications

    @classmethod
    async def mark_as_read(cls, notification_id: str, user_id: str) -> bool:
        logger.info(f"NotificationService: Marking alert {notification_id} as read for user {user_id}")
        
        notification_doc = None
        if isinstance(notification_id, int) or (isinstance(notification_id, str) and notification_id.isdigit()):
            notification_doc = await db_client.db.notifications.find_one({"notification_id": int(notification_id)})
        elif isinstance(notification_id, str) and ObjectId.is_valid(notification_id):
            notification_doc = await db_client.db.notifications.find_one({"_id": ObjectId(notification_id)})
            
        if not notification_doc:
            return False
        obj_id = notification_doc["_id"]
            
        user_obj_id = None
        if isinstance(user_id, int) or (isinstance(user_id, str) and user_id.isdigit()):
            user_doc = await db_client.db.users.find_one({"user_id": int(user_id)})
            if user_doc:
                user_obj_id = user_doc["_id"]
        elif isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_obj_id = ObjectId(user_id)
            
        if not user_obj_id:
            return False
            
        result = await db_client.db.notifications.update_one(
            {"_id": obj_id, "user_id": user_obj_id},
            {"$set": {"is_read": True}}
        )
        return result.modified_count > 0
