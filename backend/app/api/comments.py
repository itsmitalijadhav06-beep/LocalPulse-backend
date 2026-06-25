from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from app.schemas.comment import CommentCreate
from app.services.comment_service import CommentService
from app.core.dependencies import get_current_user
from app.utils.response import standard_response

router = APIRouter(prefix="/comments", tags=["Comments"])

@router.post("/{issue_id}", response_class=JSONResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    issue_id: str,
    comment_in: CommentCreate,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Post a new comment on a reported issue.
    """
    author_name = current_user.get("email", "Anonymous Citizen").split("@")[0]
    comment = await CommentService.create_comment(
        issue_id=issue_id,
        comment_in=comment_in,
        author_id=current_user["id"],
        author_name=author_name
    )
    return standard_response(
        success=True,
        message="Comment added successfully.",
        data=comment.model_dump(),
        status_code=status.HTTP_201_CREATED
    )

@router.get("/{issue_id}", response_class=JSONResponse)
async def list_comments(
    issue_id: str,
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0)
) -> JSONResponse:
    """
    List all comments associated with a reported issue.
    """
    comments = await CommentService.list_comments_for_issue(issue_id, limit=limit, skip=skip)
    return standard_response(
        success=True,
        message="Comments list retrieved successfully.",
        data=[cmt.model_dump() for cmt in comments]
    )

@router.delete("/{comment_id}", response_class=JSONResponse)
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Delete a specific comment. Only the author or administrators can delete comments.
    """
    success = await CommentService.delete_comment(comment_id, current_user["id"])
    if not success:
        return standard_response(
            success=False,
            message="Comment deletion failed or unauthorized.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    return standard_response(
        success=True,
        message="Comment deleted successfully."
    )
