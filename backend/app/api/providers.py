import logging
from fastapi import APIRouter, Depends, status, Query, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
from app.schemas.provider import ProviderCreate, ProviderUpdate
from app.services.provider_service import ProviderService
from app.core.dependencies import get_current_user, require_role
from app.core.constants import ProviderCategory
from app.utils.response import standard_response
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)
router = APIRouter(prefix="/providers", tags=["Providers"])

@router.post("/register", response_class=JSONResponse, status_code=status.HTTP_201_CREATED)
async def register_provider(
    provider_in: ProviderCreate,
    current_user: dict = Depends(require_role(["admin"]))
) -> JSONResponse:
    """
    Register the current user as a Local Service Provider.
    """
    try:
        provider = await ProviderService.register_provider(provider_in, current_user["id"])
        return standard_response(
            success=True,
            message="Service provider profile registered successfully.",
            data=provider.model_dump(),
            status_code=status.HTTP_201_CREATED
        )
    except Exception as e:
        logger.exception("Failed to register provider profile")
        return standard_response(
            success=False,
            message="Failed to register provider profile",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
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
    try:
        providers = await ProviderService.list_providers(category=category, limit=limit, skip=skip)
        return standard_response(
            success=True,
            message="Providers list fetched successfully.",
            data=[prv.model_dump() for prv in providers]
        )
    except Exception as e:
        logger.exception("Providers endpoint failed")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.get("/{provider_id}", response_class=JSONResponse)
async def get_provider(provider_id: str) -> JSONResponse:
    """
    Get contact details and ratings of a service provider.
    """
    try:
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
    except Exception as e:
        logger.exception(f"Failed to fetch details for provider {provider_id}")
        return standard_response(
            success=False,
            message="Failed to retrieve provider profile details",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
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
    try:
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
    except Exception as e:
        logger.exception(f"Failed to update provider {provider_id}")
        return standard_response(
            success=False,
            message="Failed to update provider profile",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.delete("/{provider_id}", response_class=JSONResponse)
async def delete_provider(
    provider_id: str,
    current_user: dict = Depends(require_role(["admin"]))
) -> JSONResponse:
    """
    Delete a service provider profile.
    """
    try:
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
    except Exception as e:
        logger.exception(f"Failed to delete provider {provider_id}")
        return standard_response(
            success=False,
            message="Failed to delete provider profile",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
