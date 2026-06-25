import logging
from typing import List, Optional, Any
from datetime import datetime, timezone
from bson import ObjectId
from app.schemas.provider import ProviderCreate, ProviderUpdate, ProviderResponse
from app.core.constants import ProviderCategory
from app.core.config import settings
from app.core.database import db_client

logger = logging.getLogger(settings.PROJECT_NAME)

class ProviderService:
    """
    Service for managing local service providers using MongoDB.
    """
    @classmethod
    async def _map_provider_to_response(cls, saved_provider: dict) -> ProviderResponse:
        # Resolve user_id (user)
        user_id = 0
        u_val = saved_provider.get("user_id")
        if u_val:
            try:
                u_obj_id = ObjectId(u_val) if isinstance(u_val, str) else u_val
                user_doc = await db_client.db.users.find_one({"_id": u_obj_id}, {"user_id": 1})
                if user_doc:
                    user_id = user_doc.get("user_id", 0)
            except Exception:
                pass

        # Resolve assigned_issues (issues)
        assigned_issues = []
        iss_list = saved_provider.get("assigned_issues", [])
        if iss_list:
            try:
                iss_obj_ids = []
                for iss in iss_list:
                    if isinstance(iss, str) and ObjectId.is_valid(iss):
                        iss_obj_ids.append(ObjectId(iss))
                    elif isinstance(iss, ObjectId):
                        iss_obj_ids.append(iss)
                
                if iss_obj_ids:
                    issues_cursor = db_client.db.issues.find({"_id": {"$in": iss_obj_ids}}, {"issue_id": 1})
                    async for i in issues_cursor:
                        if "issue_id" in i:
                            assigned_issues.append(i["issue_id"])
            except Exception:
                pass

        return ProviderResponse(
            id=saved_provider["provider_id"],
            name=saved_provider["name"],
            user_id=user_id,
            category=saved_provider["category"],
            contact_email=saved_provider["contact_email"],
            contact_phone=saved_provider["contact_phone"],
            service_radius_km=saved_provider["service_radius_km"],
            latitude=saved_provider["latitude"],
            longitude=saved_provider["longitude"],
            assigned_issues=assigned_issues,
            rating=saved_provider.get("rating", 5.0),
            created_at=saved_provider["created_at"],
            updated_at=saved_provider["updated_at"]
        )

    @classmethod
    async def register_provider(cls, provider_in: ProviderCreate, user_id: str) -> ProviderResponse:
        logger.info(f"ProviderService: Registering provider '{provider_in.name}' for user {user_id}")
        from app.core.database import get_next_sequence_value
        provider_id = await get_next_sequence_value("providers")
        
        provider_document = {
            "provider_id": provider_id,
            "name": provider_in.name,
            "user_id": ObjectId(user_id),
            "category": provider_in.category.value if hasattr(provider_in.category, 'value') else provider_in.category,
            "contact_email": provider_in.contact_email,
            "contact_phone": provider_in.contact_phone,
            "service_radius_km": provider_in.service_radius_km,
            "latitude": provider_in.latitude,
            "longitude": provider_in.longitude,
            "assigned_issues": [],
            "rating": 5.0,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await db_client.db.providers.insert_one(provider_document)
        saved_provider = await db_client.db.providers.find_one({"_id": result.inserted_id})
        return await cls._map_provider_to_response(saved_provider)

    @classmethod
    async def get_provider_by_id(cls, provider_id: str) -> Optional[ProviderResponse]:
        logger.info(f"ProviderService: Retrieving provider details for {provider_id}")
        provider_doc = None
        if isinstance(provider_id, int) or (isinstance(provider_id, str) and provider_id.isdigit()):
            provider_doc = await db_client.db.providers.find_one({"provider_id": int(provider_id)})
        elif isinstance(provider_id, str) and ObjectId.is_valid(provider_id):
            provider_doc = await db_client.db.providers.find_one({"_id": ObjectId(provider_id)})
            
        if not provider_doc:
            return None
            
        return await cls._map_provider_to_response(provider_doc)

    @classmethod
    async def get_provider_by_user_id(cls, user_id: str) -> Optional[ProviderResponse]:
        logger.info(f"ProviderService: Fetching provider for user account {user_id}")
        user_obj_id = None
        if isinstance(user_id, int) or (isinstance(user_id, str) and user_id.isdigit()):
            user_doc = await db_client.db.users.find_one({"user_id": int(user_id)})
            if user_doc:
                user_obj_id = user_doc["_id"]
        elif isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_obj_id = ObjectId(user_id)
            
        if not user_obj_id:
            return None
            
        saved_provider = await db_client.db.providers.find_one({"user_id": user_obj_id})
        if not saved_provider:
            return None
            
        return await cls._map_provider_to_response(saved_provider)

    @classmethod
    async def list_providers(
        cls, 
        category: Optional[ProviderCategory] = None, 
        limit: int = 10, 
        skip: int = 0
    ) -> List[ProviderResponse]:
        logger.info(f"ProviderService: Listing providers (category={category}, limit={limit})")
        
        query = {}
        if category:
            query["category"] = category.value if hasattr(category, "value") else category
            
        cursor = db_client.db.providers.find(query).skip(skip).limit(limit)
        providers = []
        async for saved_provider in cursor:
            providers.append(await cls._map_provider_to_response(saved_provider))
        return providers

    @classmethod
    async def update_provider(
        cls, 
        provider_id: str, 
        provider_update: ProviderUpdate
    ) -> Optional[ProviderResponse]:
        logger.info(f"ProviderService: Updating provider details for {provider_id}")
        provider_doc = None
        if isinstance(provider_id, int) or (isinstance(provider_id, str) and provider_id.isdigit()):
            provider_doc = await db_client.db.providers.find_one({"provider_id": int(provider_id)})
        elif isinstance(provider_id, str) and ObjectId.is_valid(provider_id):
            provider_doc = await db_client.db.providers.find_one({"_id": ObjectId(provider_id)})
            
        if not provider_doc:
            return None
        obj_id = provider_doc["_id"]
            
        update_data: dict[str, Any] = {}
        if provider_update.name is not None:
            update_data["name"] = provider_update.name
        if provider_update.category is not None:
            update_data["category"] = provider_update.category.value if hasattr(provider_update.category, "value") else provider_update.category
        if provider_update.contact_email is not None:
            update_data["contact_email"] = provider_update.contact_email
        if provider_update.contact_phone is not None:
            update_data["contact_phone"] = provider_update.contact_phone
        if provider_update.service_radius_km is not None:
            update_data["service_radius_km"] = provider_update.service_radius_km
        if provider_update.latitude is not None:
            update_data["latitude"] = provider_update.latitude
        if provider_update.longitude is not None:
            update_data["longitude"] = provider_update.longitude
            
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)
            await db_client.db.providers.update_one({"_id": obj_id}, {"$set": update_data})
            
        return await cls.get_provider_by_id(str(obj_id))
