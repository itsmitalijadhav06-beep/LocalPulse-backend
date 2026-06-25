import logging
from typing import Any
from fastapi import Request, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.utils.response import standard_response
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle generic system exceptions and log tracebacks.
    """
    logger.error(f"Unhandled system exception occurred: {exc}", exc_info=True)
    error_detail = str(exc) if settings.DEBUG else None
    return standard_response(
        success=False,
        message="An unexpected server error occurred.",
        errors=error_detail,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

async def http_exception_handler(request: Request, exc: Any) -> JSONResponse:
    """
    Handle standard HTTPExceptions thrown during request processing.
    """
    logger.warning(f"HTTP exception at {request.url.path}: {exc.status_code} - {exc.detail}")
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )
    return standard_response(
        success=False,
        message=exc.detail,
        status_code=exc.status_code
    )

async def validation_exception_handler(
    request: Request, 
    exc: Any
) -> JSONResponse:
    """
    Handle schema verification and query validation errors.
    """
    errors = exc.errors()
    logger.warning(f"Validation failure at {request.url.path}: {errors}")
    return standard_response(
        success=False,
        message="Request validation failed.",
        errors=errors,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )
