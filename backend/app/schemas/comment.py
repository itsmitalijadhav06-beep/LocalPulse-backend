from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)

class CommentResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int
    issue_id: int
    author_id: int
    author_name: str
    content: str
    created_at: datetime
    updated_at: datetime
