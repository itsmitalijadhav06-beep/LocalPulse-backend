from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from app.core.dependencies import require_role
from app.core.constants import UserRole
from app.services.dashboard_service import DashboardService
from app.utils.response import standard_response
from app.schemas.system_config import SystemConfigUpdate
from app.services.system_config_service import SystemConfigService

# Restrict the entire router to users with the 'admin' role
router = APIRouter(
    prefix="/admin", 
    tags=["Administration"],
    dependencies=[Depends(require_role(["admin"]))]
)

@router.get("/stats", response_class=JSONResponse)
async def get_system_stats() -> JSONResponse:
    """
    Get deep system usage stats for administrators.
    """
    stats = await DashboardService.get_admin_summary()
    return standard_response(
        success=True,
        message="System analytics loaded successfully.",
        data=stats
    )

@router.post("/moderate/comments/{comment_id}", response_class=JSONResponse)
async def moderate_comment(
    comment_id: str,
    action: str = Query("approve", description="Either 'approve' or 'remove'")
) -> JSONResponse:
    """
    Moderate citizen comments. Action must be 'approve' or 'remove'.
    """
    return standard_response(
        success=True,
        message=f"Comment {comment_id} has been moderated. Action: {action}."
    )

@router.put("/system-config", response_class=JSONResponse)
async def update_system_config(config_updates: SystemConfigUpdate) -> JSONResponse:
    """
    Modify application-wide defaults and system parameters.
    """
    updated_config = await SystemConfigService.update_config(config_updates)
    return standard_response(
        success=True,
        message="System configuration parameters updated.",
        data=updated_config.model_dump(mode="json")
    )
