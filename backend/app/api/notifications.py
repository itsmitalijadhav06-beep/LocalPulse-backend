from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from app.services.notification_service import NotificationService
from app.core.dependencies import get_current_user
from app.utils.response import standard_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_class=JSONResponse)
async def list_notifications(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    List notifications for the logged-in user.
    """
    notifications = await NotificationService.list_user_notifications(
        user_id=current_user["id"],
        limit=limit,
        skip=skip
    )
    return standard_response(
        success=True,
        message="Notifications list fetched successfully.",
        data=[ntf.model_dump() for ntf in notifications]
    )

@router.put("/{notification_id}/read", response_class=JSONResponse)
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Mark a specific notification as read.
    """
    success = await NotificationService.mark_as_read(notification_id, current_user["id"])
    if not success:
        return standard_response(
            success=False,
            message="Failed to update notification status.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    return standard_response(
        success=True,
        message="Notification marked as read successfully."
    )
