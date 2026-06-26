from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from app.services.dashboard_service import DashboardService
from app.core.dependencies import require_role, get_current_user
from app.utils.response import standard_response

router = APIRouter(
    prefix="/dashboard", 
    tags=["Dashboard"]
)

@router.get("/summary", response_class=JSONResponse, dependencies=[Depends(require_role(["admin"]))])
async def get_dashboard_summary(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Retrieve global summary analytics (administrator only).
    """
    summary_data = await DashboardService.get_admin_summary()
    return summary_data

@router.get("/citizen-summary", response_class=JSONResponse)
async def get_citizen_summary(
    latitude: float = 0.0,
    longitude: float = 0.0,
    radius_km: float = 5.0,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Retrieve personalized summary for a citizen based on location.
    """
    summary_data = await DashboardService.get_citizen_summary(
        latitude=latitude, 
        longitude=longitude, 
        radius_km=radius_km
    )
    return standard_response(success=True, message="Citizen summary generated", data=summary_data)

