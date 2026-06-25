from typing import Any, Optional
from uuid import UUID
from bson import ObjectId
from fastapi import status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def standard_response(
    success: bool,
    message: str,
    data: Optional[Any] = None,
    errors: Optional[Any] = None,
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    """
    Generate a standardized JSONResponse envelope.

    Uses fastapi.encoders.jsonable_encoder to safely serialize any value
    that is not natively JSON-serializable (datetime, UUID, ObjectId,
    Decimal, Pydantic models, etc.) before handing the payload to
    JSONResponse.

    All controllers and error handlers should wrap their output using
    this helper.
    """
    payload = {
        "success": success,
        "message": message,
        "data": data,
        "errors": errors,
    }
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(
            payload,
            custom_encoder={
                ObjectId: str,
                UUID: str,
            }
        ),
    )
