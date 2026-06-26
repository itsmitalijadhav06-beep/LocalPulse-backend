from fastapi import APIRouter, Depends, status, Query, File, UploadFile, Request
from fastapi.responses import JSONResponse
from app.schemas.issue import IssueCreate, IssueUpdate
from app.services.issue_service import IssueService
from app.core.dependencies import get_current_user
from app.utils.response import standard_response

router = APIRouter(prefix="/issues", tags=["Issues"])

@router.post("", response_class=JSONResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    issue_in: IssueCreate, 
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Report a new community issue.
    """
    issue = await IssueService.create_issue(issue_in, current_user["id"])
    return standard_response(
        success=True,
        message="Issue reported successfully.",
        data=issue.model_dump(),
        status_code=status.HTTP_201_CREATED
    )

@router.get("", response_class=JSONResponse)
async def list_issues(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0)
) -> JSONResponse:
    """
    List all reported community issues with pagination.
    """
    issues = await IssueService.list_issues(limit=limit, skip=skip)
    return standard_response(
        success=True,
        message="Issues list retrieved successfully.",
        data=[iss.model_dump() for iss in issues]
    )

@router.get("/{issue_id}", response_class=JSONResponse)
async def get_issue(issue_id: str) -> JSONResponse:
    """
    Get detailed information about a reported issue.
    """
    issue = await IssueService.get_issue_by_id(issue_id)
    if not issue:
        return standard_response(
            success=False,
            message="Issue not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Issue details retrieved successfully.",
        data=issue.model_dump()
    )

@router.put("/{issue_id}", response_class=JSONResponse)
async def update_issue(
    issue_id: str, 
    issue_update: IssueUpdate,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Update details or status of a reported issue.
    """
    issue = await IssueService.update_issue(issue_id, issue_update)
    if not issue:
        return standard_response(
            success=False,
            message="Issue update failed. Issue not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Issue updated successfully.",
        data=issue.model_dump()
    )

@router.patch("/{issue_id}", response_class=JSONResponse)
async def patch_issue(
    issue_id: str,
    issue_update: IssueUpdate,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Patch details or status of a reported issue.
    """
    issue = await IssueService.update_issue(issue_id, issue_update)
    if not issue:
        return standard_response(
            success=False,
            message="Issue update failed. Issue not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Issue updated successfully.",
        data=issue.model_dump()
    )

@router.delete("/{issue_id}", response_class=JSONResponse)
async def delete_issue(
    issue_id: str,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Delete a reported community issue.
    """
    success = await IssueService.delete_issue(issue_id)
    if not success:
        return standard_response(
            success=False,
            message="Issue not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Issue deleted successfully."
    )

@router.post("/{issue_id}/upvote", response_class=JSONResponse)
async def upvote_issue(
    issue_id: str,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Upvote an issue to prioritize it.
    """
    issue = await IssueService.upvote_issue(issue_id, current_user["id"])
    if not issue:
        return standard_response(
            success=False,
            message="Issue not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Issue upvoted successfully.",
        data=issue.model_dump()
    )

@router.post("/{issue_id}/subscribe", response_class=JSONResponse)
async def subscribe_issue(
    issue_id: str,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Subscribe to receive status updates for this issue.
    """
    issue = await IssueService.subscribe_issue(issue_id, current_user["id"])
    if not issue:
        return standard_response(
            success=False,
            message="Issue not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Subscribed to issue updates successfully.",
        data=issue.model_dump()
    )


@router.post("/upload", response_class=JSONResponse)
async def upload_issue_image(
    request: Request,
    file: UploadFile = File(...)
) -> JSONResponse:
    """
    Upload an image for an issue report.
    """
    import os
    import uuid

    # Check file type
    if not file.content_type or not file.content_type.startswith("image/"):
        return standard_response(
            success=False,
            message="File must be an image.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    
    # Generate unique filename
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join("uploads", filename)
    
    # Save file
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        return standard_response(
            success=False,
            message=f"Failed to save image file: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    # Return public URL
    base_url = str(request.base_url)
    if not base_url.endswith("/"):
        base_url += "/"
    image_url = f"{base_url}uploads/{filename}"
    
    return standard_response(
        success=True,
        message="Image uploaded successfully.",
        data={"image_url": image_url}
    )

