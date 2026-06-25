import logging
from typing import List, Optional, Any
from datetime import datetime, timezone
from bson import ObjectId
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.core.config import settings
from app.core.database import db_client

logger = logging.getLogger(settings.PROJECT_NAME)

class EventService:
    """
    Service for organizing community events using MongoDB.
    """
    @classmethod
    async def _map_event_to_response(cls, saved_event: dict) -> EventResponse:
        # Resolve organizer_id (user)
        organizer_id = 0
        org_val = saved_event.get("organizer_id")
        if org_val:
            try:
                org_obj_id = ObjectId(org_val) if isinstance(org_val, str) else org_val
                user_doc = await db_client.db.users.find_one({"_id": org_obj_id}, {"user_id": 1})
                if user_doc:
                    organizer_id = user_doc.get("user_id", 0)
            except Exception:
                pass

        # Resolve attendees (users)
        attendee_ids = []
        att_list = saved_event.get("attendees", [])
        if att_list:
            try:
                att_obj_ids = []
                for att in att_list:
                    if isinstance(att, str) and ObjectId.is_valid(att):
                        att_obj_ids.append(ObjectId(att))
                    elif isinstance(att, ObjectId):
                        att_obj_ids.append(att)
                
                if att_obj_ids:
                    users_cursor = db_client.db.users.find({"_id": {"$in": att_obj_ids}}, {"user_id": 1})
                    async for u in users_cursor:
                        if "user_id" in u:
                            attendee_ids.append(u["user_id"])
            except Exception:
                pass

        return EventResponse(
            id=saved_event["event_id"],
            title=saved_event["title"],
            description=saved_event["description"],
            organizer_id=organizer_id,
            organizer_name=saved_event["organizer_name"],
            event_date=saved_event["event_date"],
            location_address=saved_event["location_address"],
            latitude=saved_event["latitude"],
            longitude=saved_event["longitude"],
            attendees=attendee_ids,
            max_attendees=saved_event.get("max_attendees"),
            created_at=saved_event["created_at"],
            updated_at=saved_event["updated_at"]
        )

    @classmethod
    async def create_event(
        cls, 
        event_in: EventCreate, 
        organizer_id: str,
        organizer_name: str
    ) -> EventResponse:
        logger.info(f"EventService: Creating event '{event_in.title}' by organizer {organizer_id}")
        from app.core.database import get_next_sequence_value
        event_id = await get_next_sequence_value("events")
        
        event_document = {
            "event_id": event_id,
            "title": event_in.title,
            "description": event_in.description,
            "organizer_id": ObjectId(organizer_id),
            "organizer_name": organizer_name,
            "event_date": event_in.event_date,
            "location_address": event_in.location_address,
            "latitude": event_in.latitude,
            "longitude": event_in.longitude,
            "location": {
                "type": "Point",
                "coordinates": [event_in.longitude, event_in.latitude]
            },
            "attendees": [organizer_id],
            "max_attendees": event_in.max_attendees,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db_client.db.events.insert_one(event_document)
        saved_event = await db_client.db.events.find_one({"_id": result.inserted_id})
        return await cls._map_event_to_response(saved_event)

    @classmethod
    async def get_event_by_id(cls, event_id: str) -> Optional[EventResponse]:
        logger.info(f"EventService: Retrieving event {event_id}")
        event_doc = None
        if isinstance(event_id, int) or (isinstance(event_id, str) and event_id.isdigit()):
            event_doc = await db_client.db.events.find_one({"event_id": int(event_id)})
        elif isinstance(event_id, str) and ObjectId.is_valid(event_id):
            event_doc = await db_client.db.events.find_one({"_id": ObjectId(event_id)})
            
        if not event_doc:
            return None
            
        return await cls._map_event_to_response(event_doc)

    @classmethod
    async def list_events(cls, limit: int = 10, skip: int = 0) -> List[EventResponse]:
        logger.info(f"EventService: Listing events (limit={limit}, skip={skip})")
        cursor = db_client.db.events.find().skip(skip).limit(limit)
        events = []
        async for saved_event in cursor:
            events.append(await cls._map_event_to_response(saved_event))
        return events

    @classmethod
    async def update_event(cls, event_id: str, event_update: EventUpdate) -> Optional[EventResponse]:
        logger.info(f"EventService: Updating event {event_id}")
        event_doc = None
        if isinstance(event_id, int) or (isinstance(event_id, str) and event_id.isdigit()):
            event_doc = await db_client.db.events.find_one({"event_id": int(event_id)})
        elif isinstance(event_id, str) and ObjectId.is_valid(event_id):
            event_doc = await db_client.db.events.find_one({"_id": ObjectId(event_id)})
            
        if not event_doc:
            return None
        obj_id = event_doc["_id"]
            
        update_data: dict[str, Any] = {}
        if event_update.title is not None:
            update_data["title"] = event_update.title
        if event_update.description is not None:
            update_data["description"] = event_update.description
        if event_update.event_date is not None:
            update_data["event_date"] = event_update.event_date
        if event_update.location_address is not None:
            update_data["location_address"] = event_update.location_address
        if event_update.latitude is not None:
            update_data["latitude"] = event_update.latitude
        if event_update.longitude is not None:
            update_data["longitude"] = event_update.longitude
        if event_update.max_attendees is not None:
            update_data["max_attendees"] = event_update.max_attendees
            
        if update_data:
            if "longitude" in update_data or "latitude" in update_data:
                lon = update_data.get("longitude", event_doc.get("longitude"))
                lat = update_data.get("latitude", event_doc.get("latitude"))
                update_data["location"] = {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            update_data["updated_at"] = datetime.now(timezone.utc)
            await db_client.db.events.update_one({"_id": obj_id}, {"$set": update_data})
            
        return await cls.get_event_by_id(str(obj_id))

    @classmethod
    async def rsvp_to_event(cls, event_id: str, user_id: str) -> Optional[EventResponse]:
        logger.info(f"EventService: RSVP user {user_id} to event {event_id}")
        event_doc = None
        if isinstance(event_id, int) or (isinstance(event_id, str) and event_id.isdigit()):
            event_doc = await db_client.db.events.find_one({"event_id": int(event_id)})
        elif isinstance(event_id, str) and ObjectId.is_valid(event_id):
            event_doc = await db_client.db.events.find_one({"_id": ObjectId(event_id)})
            
        if not event_doc:
            return None
            
        await db_client.db.events.update_one(
            {"_id": event_doc["_id"]},
            {"$addToSet": {"attendees": user_id}}
        )
        return await cls.get_event_by_id(str(event_doc["_id"]))

    @classmethod
    async def cancel_rsvp(cls, event_id: str, user_id: str) -> Optional[EventResponse]:
        logger.info(f"EventService: Canceling RSVP for user {user_id} to event {event_id}")
        event_doc = None
        if isinstance(event_id, int) or (isinstance(event_id, str) and event_id.isdigit()):
            event_doc = await db_client.db.events.find_one({"event_id": int(event_id)})
        elif isinstance(event_id, str) and ObjectId.is_valid(event_id):
            event_doc = await db_client.db.events.find_one({"_id": ObjectId(event_id)})
            
        if not event_doc:
            return None
            
        await db_client.db.events.update_one(
            {"_id": event_doc["_id"]},
            {"$pull": {"attendees": user_id}}
        )
        return await cls.get_event_by_id(str(event_doc["_id"]))
