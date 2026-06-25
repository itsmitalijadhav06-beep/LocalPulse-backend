from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from app.services.dashboard_service import DashboardService
from app.core.dependencies import require_role, get_current_user

router = APIRouter(
    prefix="/dashboard", 
    tags=["Dashboard"],
    dependencies=[Depends(require_role(["admin"]))]
)

@router.get("/summary", response_class=JSONResponse)
async def get_dashboard_summary(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Retrieve global summary analytics (administrator only).
    """
    summary_data = await DashboardService.get_admin_summary()
    return summary_data
