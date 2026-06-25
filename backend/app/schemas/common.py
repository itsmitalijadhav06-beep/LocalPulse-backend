from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")

class CoordinateSchema(BaseModel):
    """
    Standard schema for validating coordinates.
    """
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude value between -90 and 90")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude value between -180 and 180")

class PaginationQueryParams(BaseModel):
    """
    Validation for pagination query parameters.
    """
    limit: int = Field(10, ge=1, le=100, description="Number of items to return")
    skip: int = Field(0, ge=0, description="Number of items to skip")

class PaginationResponse(BaseModel, Generic[T]):
    """
    Wrapper envelope for paginated list responses.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    items: List[T]
    total: int
    limit: int
    skip: int
