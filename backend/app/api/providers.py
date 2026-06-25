from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from typing import Optional
from app.schemas.provider import ProviderCreate, ProviderUpdate
from app.services.provider_service import ProviderService
from app.core.dependencies import get_current_user, require_role
from app.core.constants import ProviderCategory
from app.utils.response import standard_response

router = APIRouter(prefix="/providers", tags=["Providers"])

@router.post("/register", response_class=JSONResponse, status_code=status.HTTP_201_CREATED)
async def register_provider(
    provider_in: ProviderCreate,
    current_user: dict = Depends(require_role(["admin"]))
) -> JSONResponse:
    """
    Register the current user as a Local Service Provider.
    """
    provider = await ProviderService.register_provider(provider_in, current_user["id"])
    return standard_response(
        success=True,
        message="Service provider profile registered successfully.",
        data=provider.model_dump(),
        status_code=status.HTTP_201_CREATED
    )

@router.get("", response_class=JSONResponse)
async def list_providers(
    category: Optional[ProviderCategory] = None,
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0)
) -> JSONResponse:
    """
    List registered service providers with optional category filters.
    """
    providers = await ProviderService.list_providers(category=category, limit=limit, skip=skip)
    return standard_response(
        success=True,
        message="Providers list fetched successfully.",
        data=[prv.model_dump() for prv in providers]
    )

@router.get("/{provider_id}", response_class=JSONResponse)
async def get_provider(provider_id: str) -> JSONResponse:
    """
    Get contact details and ratings of a service provider.
    """
    provider = await ProviderService.get_provider_by_id(provider_id)
    if not provider:
        return standard_response(
            success=False,
            message="Provider not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Provider profile details retrieved.",
        data=provider.model_dump()
    )

@router.put("/{provider_id}", response_class=JSONResponse)
async def update_provider(
    provider_id: str,
    provider_update: ProviderUpdate,
    current_user: dict = Depends(require_role(["admin"]))
) -> JSONResponse:
    """
    Update service radius, contact details, or location of a provider.
    """
    provider = await ProviderService.update_provider(provider_id, provider_update)
    if not provider:
        return standard_response(
            success=False,
            message="Provider profile update failed.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Provider profile updated successfully.",
        data=provider.model_dump()
    )

@router.delete("/{provider_id}", response_class=JSONResponse)
async def delete_provider(
    provider_id: str,
    current_user: dict = Depends(require_role(["admin"]))
) -> JSONResponse:
    """
    Delete a service provider profile.
    """
    success = await ProviderService.delete_provider(provider_id)
    if not success:
        return standard_response(
            success=False,
            message="Provider not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Provider profile deleted successfully."
    )
