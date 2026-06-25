import logging
from typing import List, Optional, Any
from datetime import datetime, timezone
from bson import ObjectId
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from app.core.constants import IssueStatus
from app.core.config import settings
from app.core.database import db_client

logger = logging.getLogger(settings.PROJECT_NAME)

class IssueService:
    """
    Service for managing community issue reports using MongoDB.
    """
    @classmethod
    async def _map_issue_to_response(cls, saved_issue: dict) -> IssueResponse:
        # Resolve reported_by (user)
        reported_by_id = 0
        rep_val = saved_issue.get("reported_by")
        if rep_val:
            try:
                rep_obj_id = ObjectId(rep_val) if isinstance(rep_val, str) else rep_val
                user_doc = await db_client.db.users.find_one({"_id": rep_obj_id}, {"user_id": 1})
                if user_doc:
                    reported_by_id = user_doc.get("user_id", 0)
            except Exception:
                pass

        # Resolve assigned_provider_id (provider)
        assigned_provider_id = None
        prov_val = saved_issue.get("assigned_provider_id")
        if prov_val:
            try:
                prov_obj_id = ObjectId(prov_val) if isinstance(prov_val, str) else prov_val
                prov_doc = await db_client.db.providers.find_one({"_id": prov_obj_id}, {"provider_id": 1})
                if prov_doc:
                    assigned_provider_id = prov_doc.get("provider_id")
            except Exception:
                pass

        # Resolve subscribers (users)
        subscriber_ids = []
        sub_list = saved_issue.get("subscribers", [])
        if sub_list:
            try:
                sub_obj_ids = []
                for sub in sub_list:
                    if isinstance(sub, str) and ObjectId.is_valid(sub):
                        sub_obj_ids.append(ObjectId(sub))
                    elif isinstance(sub, ObjectId):
                        sub_obj_ids.append(sub)
                
                if sub_obj_ids:
                    users_cursor = db_client.db.users.find({"_id": {"$in": sub_obj_ids}}, {"user_id": 1})
                    async for u in users_cursor:
                        if "user_id" in u:
                            subscriber_ids.append(u["user_id"])
            except Exception:
                pass

        return IssueResponse(
            id=saved_issue["issue_id"],
            title=saved_issue["title"],
            description=saved_issue["description"],
            category=saved_issue["category"],
            status=saved_issue["status"],
            reported_by=reported_by_id,
            assigned_provider_id=assigned_provider_id,
            latitude=saved_issue["latitude"],
            longitude=saved_issue["longitude"],
            image_url=saved_issue.get("image_url"),
            upvotes=saved_issue.get("upvotes", 0),
            subscribers=subscriber_ids,
            created_at=saved_issue["created_at"],
            updated_at=saved_issue["updated_at"]
        )

    @classmethod
    async def create_issue(cls, issue_in: IssueCreate, reporter_id: str) -> IssueResponse:
        logger.info("Creating issue...")
        from app.core.database import get_next_sequence_value
        issue_id = await get_next_sequence_value("issues")
        
        issue_document = {
            "issue_id": issue_id,
            "title": issue_in.title,
            "description": issue_in.description,
            "category": issue_in.category,
            "status": "Open",
            "reported_by": ObjectId(reporter_id),
            "latitude": issue_in.latitude,
            "longitude": issue_in.longitude,
            "location": {
                "type": "Point",
                "coordinates": [issue_in.longitude, issue_in.latitude]
            },
            "image_url": issue_in.image_url,
            "upvotes": 0,
            "comments_count": 0,
            "anonymous": False,
            "subscribers": [reporter_id],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        logger.info("Saving to MongoDB...")
        result = await db_client.db.issues.insert_one(issue_document)
        logger.info(f"Inserted ObjectId: {result.inserted_id}")
        
        saved_issue = await db_client.db.issues.find_one({"_id": result.inserted_id})
        return await cls._map_issue_to_response(saved_issue)

    @classmethod
    async def get_issue_by_id(cls, issue_id: str) -> Optional[IssueResponse]:
        logger.info(f"IssueService: Getting issue {issue_id}")
        issue_doc = None
        if isinstance(issue_id, int) or (isinstance(issue_id, str) and issue_id.isdigit()):
            issue_doc = await db_client.db.issues.find_one({"issue_id": int(issue_id)})
        elif isinstance(issue_id, str) and ObjectId.is_valid(issue_id):
            issue_doc = await db_client.db.issues.find_one({"_id": ObjectId(issue_id)})
            
        if not issue_doc:
            return None
            
        return await cls._map_issue_to_response(issue_doc)

    @classmethod
    async def list_issues(cls, limit: int = 10, skip: int = 0) -> List[IssueResponse]:
        logger.info(f"IssueService: Listing issues (limit={limit}, skip={skip})")
        cursor = db_client.db.issues.find().skip(skip).limit(limit)
        issues = []
        async for saved_issue in cursor:
            issues.append(await cls._map_issue_to_response(saved_issue))
        return issues

    @classmethod
    async def update_issue(cls, issue_id: str, issue_update: IssueUpdate) -> Optional[IssueResponse]:
        logger.info(f"IssueService: Updating issue {issue_id}")
        issue_doc = None
        if isinstance(issue_id, int) or (isinstance(issue_id, str) and issue_id.isdigit()):
            issue_doc = await db_client.db.issues.find_one({"issue_id": int(issue_id)})
        elif isinstance(issue_id, str) and ObjectId.is_valid(issue_id):
            issue_doc = await db_client.db.issues.find_one({"_id": ObjectId(issue_id)})
            
        if not issue_doc:
            return None
        obj_id = issue_doc["_id"]
            
        update_data: dict[str, Any] = {}
        if issue_update.title is not None:
            update_data["title"] = issue_update.title
        if issue_update.description is not None:
            update_data["description"] = issue_update.description
        if issue_update.category is not None:
            update_data["category"] = issue_update.category
        if issue_update.status is not None:
            update_data["status"] = issue_update.status.value if hasattr(issue_update.status, "value") else issue_update.status
        if issue_update.assigned_provider_id is not None:
            prov_id_val = issue_update.assigned_provider_id
            prov_obj_id = None
            if prov_id_val:
                if str(prov_id_val).isdigit():
                    p_doc = await db_client.db.providers.find_one({"provider_id": int(prov_id_val)})
                    if p_doc:
                        prov_obj_id = p_doc["_id"]
                elif ObjectId.is_valid(str(prov_id_val)):
                    prov_obj_id = ObjectId(str(prov_id_val))
            update_data["assigned_provider_id"] = prov_obj_id
        if issue_update.image_url is not None:
            update_data["image_url"] = issue_update.image_url
            
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)
            await db_client.db.issues.update_one({"_id": obj_id}, {"$set": update_data})
            
        return await cls.get_issue_by_id(str(obj_id))

    @classmethod
    async def delete_issue(cls, issue_id: str) -> bool:
        logger.info(f"IssueService: Deleting issue {issue_id}")
        issue_doc = None
        if isinstance(issue_id, int) or (isinstance(issue_id, str) and issue_id.isdigit()):
            issue_doc = await db_client.db.issues.find_one({"issue_id": int(issue_id)})
        elif isinstance(issue_id, str) and ObjectId.is_valid(issue_id):
            issue_doc = await db_client.db.issues.find_one({"_id": ObjectId(issue_id)})
            
        if not issue_doc:
            return False
            
        result = await db_client.db.issues.delete_one({"_id": issue_doc["_id"]})
        return result.deleted_count > 0

    @classmethod
    async def upvote_issue(cls, issue_id: str, user_id: str) -> Optional[IssueResponse]:
        logger.info(f"IssueService: User {user_id} upvoting issue {issue_id}")
        issue_doc = None
        if isinstance(issue_id, int) or (isinstance(issue_id, str) and issue_id.isdigit()):
            issue_doc = await db_client.db.issues.find_one({"issue_id": int(issue_id)})
        elif isinstance(issue_id, str) and ObjectId.is_valid(issue_id):
            issue_doc = await db_client.db.issues.find_one({"_id": ObjectId(issue_id)})
            
        if not issue_doc:
            return None
            
        await db_client.db.issues.update_one(
            {"_id": issue_doc["_id"]},
            {"$inc": {"upvotes": 1}}
        )
        return await cls.get_issue_by_id(str(issue_doc["_id"]))

    @classmethod
    async def subscribe_issue(cls, issue_id: str, user_id: str) -> Optional[IssueResponse]:
        logger.info(f"IssueService: User {user_id} subscribing to notifications on issue {issue_id}")
        issue_doc = None
        if isinstance(issue_id, int) or (isinstance(issue_id, str) and issue_id.isdigit()):
            issue_doc = await db_client.db.issues.find_one({"issue_id": int(issue_id)})
        elif isinstance(issue_id, str) and ObjectId.is_valid(issue_id):
            issue_doc = await db_client.db.issues.find_one({"_id": ObjectId(issue_id)})
            
        if not issue_doc:
            return None
            
        await db_client.db.issues.update_one(
            {"_id": issue_doc["_id"]},
            {"$addToSet": {"subscribers": user_id}}
        )
        return await cls.get_issue_by_id(str(issue_doc["_id"]))
