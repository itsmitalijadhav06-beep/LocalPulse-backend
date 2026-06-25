import logging
from typing import List
from datetime import datetime, timezone
from bson import ObjectId
from app.schemas.comment import CommentCreate, CommentResponse
from app.core.config import settings
from app.core.database import db_client

logger = logging.getLogger(settings.PROJECT_NAME)

class CommentService:
    """
    Service for managing comments on issue reports using MongoDB.
    """
    @classmethod
    async def _map_comment_to_response(cls, saved_comment: dict) -> CommentResponse:
        # Resolve issue_id (issue)
        issue_id = 0
        iss_val = saved_comment.get("issue_id")
        if iss_val:
            try:
                iss_obj_id = ObjectId(iss_val) if isinstance(iss_val, str) else iss_val
                issue_doc = await db_client.db.issues.find_one({"_id": iss_obj_id}, {"issue_id": 1})
                if issue_doc:
                    issue_id = issue_doc.get("issue_id", 0)
            except Exception:
                pass

        # Resolve author_id (user)
        author_id = 0
        auth_val = saved_comment.get("author_id")
        if auth_val:
            try:
                auth_obj_id = ObjectId(auth_val) if isinstance(auth_val, str) else auth_val
                user_doc = await db_client.db.users.find_one({"_id": auth_obj_id}, {"user_id": 1})
                if user_doc:
                    author_id = user_doc.get("user_id", 0)
            except Exception:
                pass

        return CommentResponse(
            id=saved_comment["comment_id"],
            issue_id=issue_id,
            author_id=author_id,
            author_name=saved_comment["author_name"],
            content=saved_comment["content"],
            created_at=saved_comment["created_at"],
            updated_at=saved_comment["updated_at"]
        )

    @classmethod
    async def create_comment(
        cls, 
        issue_id: str, 
        comment_in: CommentCreate, 
        author_id: str,
        author_name: str
    ) -> CommentResponse:
        logger.info(f"CommentService: Creating comment on issue {issue_id} by user {author_id}")
        
        issue_doc = None
        if isinstance(issue_id, int) or (isinstance(issue_id, str) and issue_id.isdigit()):
            issue_doc = await db_client.db.issues.find_one({"issue_id": int(issue_id)})
        elif isinstance(issue_id, str) and ObjectId.is_valid(issue_id):
            issue_doc = await db_client.db.issues.find_one({"_id": ObjectId(issue_id)})
            
        if not issue_doc:
            raise ValueError("Invalid issue_id format or issue not found.")
        issue_obj_id = issue_doc["_id"]

        from app.core.database import get_next_sequence_value
        comment_id = await get_next_sequence_value("comments")

        comment_document = {
            "comment_id": comment_id,
            "issue_id": issue_obj_id,
            "author_id": ObjectId(author_id),
            "author_name": author_name,
            "content": comment_in.content,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db_client.db.comments.insert_one(comment_document)
        saved_comment = await db_client.db.comments.find_one({"_id": result.inserted_id})
        
        # Increment comment count on issue
        try:
            await db_client.db.issues.update_one(
                {"_id": issue_obj_id},
                {"$inc": {"comments_count": 1}}
            )
        except Exception as e:
            logger.error(f"Failed to increment comment count on issue {issue_id}: {e}")
            
        return await cls._map_comment_to_response(saved_comment)

    @classmethod
    async def list_comments_for_issue(
        cls, 
        issue_id: str, 
        limit: int = 10, 
        skip: int = 0
    ) -> List[CommentResponse]:
        logger.info(f"CommentService: Listing comments for issue {issue_id}")
        
        issue_doc = None
        if isinstance(issue_id, int) or (isinstance(issue_id, str) and issue_id.isdigit()):
            issue_doc = await db_client.db.issues.find_one({"issue_id": int(issue_id)})
        elif isinstance(issue_id, str) and ObjectId.is_valid(issue_id):
            issue_doc = await db_client.db.issues.find_one({"_id": ObjectId(issue_id)})
            
        if not issue_doc:
            return []
        issue_obj_id = issue_doc["_id"]
            
        cursor = db_client.db.comments.find({"issue_id": issue_obj_id}).skip(skip).limit(limit)
        comments = []
        async for c in cursor:
            comments.append(await cls._map_comment_to_response(c))
        return comments

    @classmethod
    async def delete_comment(cls, comment_id: str, author_id: str) -> bool:
        logger.info(f"CommentService: User {author_id} deleting comment {comment_id}")
        
        comment_doc = None
        if isinstance(comment_id, int) or (isinstance(comment_id, str) and comment_id.isdigit()):
            comment_doc = await db_client.db.comments.find_one({"comment_id": int(comment_id)})
        elif isinstance(comment_id, str) and ObjectId.is_valid(comment_id):
            comment_doc = await db_client.db.comments.find_one({"_id": ObjectId(comment_id)})
            
        if not comment_doc:
            return False
        obj_id = comment_doc["_id"]
            
        is_author = str(comment_doc["author_id"]) == author_id
        is_admin = False
        try:
            user_doc = await db_client.db.users.find_one({"_id": ObjectId(author_id)})
            if user_doc and user_doc.get("role") == "admin":
                is_admin = True
        except Exception:
            pass
            
        if not is_author and not is_admin:
            return False
            
        result = await db_client.db.comments.delete_one({"_id": obj_id})
        if result.deleted_count > 0:
            try:
                await db_client.db.issues.update_one(
                    {"_id": comment_doc["issue_id"]},
                    {"$inc": {"comments_count": -1}}
                )
            except Exception as e:
                logger.error(f"Failed to decrement comment count on issue {comment_doc['issue_id']}: {e}")
            return True
        return False
