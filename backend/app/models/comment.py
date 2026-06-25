from datetime import datetime
from pydantic import BaseModel, Field
from app.utils.helpers import get_utc_now

class CommentModel(BaseModel):
    """
    Placeholder Database Model representing the Comment collection in MongoDB.
    """
    id: str = Field(default_factory=lambda: "cmt_" + get_utc_now().strftime("%Y%m%d%H%M%S"))
    issue_id: str
    author_id: str
    author_name: str
    content: str
    created_at: datetime = Field(default_factory=get_utc_now)
    updated_at: datetime = Field(default_factory=get_utc_now)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "cmt_20260625120000",
                "issue_id": "iss_123",
                "author_id": "usr_456",
                "author_name": "Jane Smith",
                "content": "I noticed this yesterday as well. It's getting dangerous.",
                "created_at": "2026-06-25T12:05:00Z"
            }
        }
