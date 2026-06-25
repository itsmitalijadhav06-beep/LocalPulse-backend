import logging
from typing import List
from datetime import datetime, timezone
from app.schemas.comment import CommentCreate, CommentResponse
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

class CommentService:
    """
    Placeholder service for managing comments on issue reports.
    """
    @classmethod
    async def create_comment(
        cls, 
        issue_id: str, 
        comment_in: CommentCreate, 
        author_id: str,
        author_name: str
    ) -> CommentResponse:
        logger.info(f"CommentService: Creating comment on issue {issue_id} by user {author_id}")
        return CommentResponse(
            id="cmt_mock123",
            issue_id=issue_id,
            author_id=author_id,
            author_name=author_name,
            content=comment_in.content,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

    @classmethod
    async def list_comments_for_issue(
        cls, 
        issue_id: str, 
        limit: int = 10, 
        skip: int = 0
    ) -> List[CommentResponse]:
        logger.info(f"CommentService: Listing comments for issue {issue_id}")
        return [
            CommentResponse(
                id="cmt_mock1",
                issue_id=issue_id,
                author_id="usr_author_mock",
                author_name="Alice Blue",
                content="This is a mock comment on the issue.",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
        ]

    @classmethod
    async def delete_comment(cls, comment_id: str, author_id: str) -> bool:
        logger.info(f"CommentService: User {author_id} deleting comment {comment_id}")
        return True
