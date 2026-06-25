from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from app.schemas.event import EventCreate, EventUpdate
from app.services.event_service import EventService
from app.core.dependencies import get_current_user
from app.utils.response import standard_response

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("", response_class=JSONResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Organize a new community event.
    """
    organizer_name = current_user.get("email", "Organizer").split("@")[0]
    event = await EventService.create_event(event_in, current_user["id"], organizer_name)
    return standard_response(
        success=True,
        message="Event scheduled successfully.",
        data=event.model_dump(),
        status_code=status.HTTP_201_CREATED
    )

@router.get("", response_class=JSONResponse)
async def list_events(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0)
) -> JSONResponse:
    """
    List scheduled community events.
    """
    events = await EventService.list_events(limit=limit, skip=skip)
    return standard_response(
        success=True,
        message="Events list fetched successfully.",
        data=[evt.model_dump() for evt in events]
    )

@router.get("/{event_id}", response_class=JSONResponse)
async def get_event(event_id: str) -> JSONResponse:
    """
    Retrieve details of a specific community event.
    """
    event = await EventService.get_event_by_id(event_id)
    if not event:
        return standard_response(
            success=False,
            message="Event not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Event details retrieved successfully.",
        data=event.model_dump()
    )

@router.put("/{event_id}", response_class=JSONResponse)
async def update_event(
    event_id: str,
    event_update: EventUpdate,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Update event schedule or details.
    """
    event = await EventService.update_event(event_id, event_update)
    if not event:
        return standard_response(
            success=False,
            message="Event not found or update failed.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Event updated successfully.",
        data=event.model_dump()
    )

@router.post("/{event_id}/rsvp", response_class=JSONResponse)
async def rsvp_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    RSVP to join the community event.
    """
    event = await EventService.rsvp_to_event(event_id, current_user["id"])
    if not event:
        return standard_response(
            success=False,
            message="Event not found.",
            status_code=status.HTTP_444_NOT_FOUND if hasattr(status, "HTTP_444_NOT_FOUND") else 404
        )
    return standard_response(
        success=True,
        message="RSVP registered successfully.",
        data=event.model_dump()
    )

@router.post("/{event_id}/rsvp/cancel", response_class=JSONResponse)
async def cancel_rsvp(
    event_id: str,
    current_user: dict = Depends(get_current_user)
) -> JSONResponse:
    """
    Cancel an existing RSVP to an event.
    """
    event = await EventService.cancel_rsvp(event_id, current_user["id"])
    if not event:
        return standard_response(
            success=False,
            message="Event not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="RSVP cancelled successfully.",
        data=event.model_dump()
    )
