from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from app.services.dashboard_service import DashboardService
from app.core.dependencies import get_current_user
from app.core.constants import UserRole
from app.utils.response import standard_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_class=JSONResponse)
async def get_dashboard_summary(
    latitude: float = Query(0.0),
    longitude: float = Query(0.0),
    radius_km: float = Query(10.0, ge=1.0, le=100.0),
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Retrieve summary analytics customized for the user's role (citizen, provider, or administrator).
    """
    user_role = current_user.get("role")
    
    if user_role == UserRole.ADMIN.value:
        summary_data = await DashboardService.get_admin_summary()
    elif user_role == UserRole.PROVIDER.value:
        from app.services.provider_service import ProviderService
        provider = await ProviderService.get_provider_by_user_id(current_user["id"])
        provider_id = provider.id if provider else current_user["id"]
        summary_data = await DashboardService.get_provider_summary(provider_id=provider_id)
    else:
        summary_data = await DashboardService.get_citizen_summary(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km
        )

    return standard_response(
        success=True,
        message="Dashboard summary loaded successfully.",
        data=summary_data
    )
