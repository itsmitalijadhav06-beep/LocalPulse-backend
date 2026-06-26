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
                    user_id = int(user_doc.get("user_id", 0))
            except Exception:
                pass

        # Resolve assigned_issues (issues)
        assigned_issues = []
        iss_list = saved_provider.get("assigned_issues", [])
        if isinstance(iss_list, list):
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
                            assigned_issues.append(int(i["issue_id"]))
            except Exception:
                pass

        # Handle datetime parsing safely
        def parse_datetime(val: Any) -> datetime:
            if isinstance(val, datetime):
                return val
            if isinstance(val, str):
                try:
                    return datetime.fromisoformat(val.replace("Z", "+00:00"))
                except ValueError:
                    pass
            return datetime.now(timezone.utc)

        # Resolve rating
        rating_val = saved_provider.get("rating")
        try:
            rating = float(rating_val) if rating_val is not None else 5.0
        except (ValueError, TypeError):
            rating = 5.0

        # Resolve provider ID
        provider_id_val = saved_provider.get("provider_id")
        try:
            id_val = int(provider_id_val) if provider_id_val is not None else 0
        except (ValueError, TypeError):
            id_val = 0

        # Resolve category
        cat_val = saved_provider.get("category")
        try:
            category = ProviderCategory(cat_val)
        except ValueError:
            category = ProviderCategory.OTHER

        # Resolve email
        email_val = saved_provider.get("contact_email")
        if not email_val or not isinstance(email_val, str) or "@" not in email_val:
            email_val = "info@localpulse.com"

        # Resolve service_radius_km, latitude, longitude
        try:
            service_radius_km = float(saved_provider.get("service_radius_km") if saved_provider.get("service_radius_km") is not None else 10.0)
        except (ValueError, TypeError):
            service_radius_km = 10.0
            
        try:
            latitude = float(saved_provider.get("latitude") if saved_provider.get("latitude") is not None else 22.7196)
        except (ValueError, TypeError):
            latitude = 22.7196
            
        try:
            longitude = float(saved_provider.get("longitude") if saved_provider.get("longitude") is not None else 75.8577)
        except (ValueError, TypeError):
            longitude = 75.8577

        return ProviderResponse(
            id=id_val,
            name=str(saved_provider.get("name") or "Unknown Provider"),
            user_id=user_id,
            category=category,
            contact_email=email_val,
            contact_phone=str(saved_provider.get("contact_phone") or ""),
            service_radius_km=service_radius_km,
            latitude=latitude,
            longitude=longitude,
            assigned_issues=assigned_issues,
            rating=rating,
            created_at=parse_datetime(saved_provider.get("created_at")),
            updated_at=parse_datetime(saved_provider.get("updated_at"))
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
        try:
            if isinstance(provider_id, int) or (isinstance(provider_id, str) and provider_id.isdigit()):
                provider_doc = await db_client.db.providers.find_one({"provider_id": int(provider_id)})
            elif isinstance(provider_id, str) and ObjectId.is_valid(provider_id):
                provider_doc = await db_client.db.providers.find_one({"_id": ObjectId(provider_id)})
        except Exception as e:
            logger.exception(f"Failed to query database for provider_id {provider_id}")
            return None
            
        if not provider_doc:
            return None
            
        try:
            return await cls._map_provider_to_response(provider_doc)
        except Exception as e:
            logger.exception(f"Failed to map provider doc for provider_id {provider_id}")
            return None

    @classmethod
    async def get_provider_by_user_id(cls, user_id: str) -> Optional[ProviderResponse]:
        logger.info(f"ProviderService: Fetching provider for user account {user_id}")
        user_obj_id = None
        try:
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
        except Exception as e:
            logger.exception(f"Failed to fetch provider for user account {user_id}")
            return None

    @classmethod
    async def list_providers(
        cls, 
        category: Optional[ProviderCategory] = None, 
        limit: int = 10, 
        skip: int = 0
    ) -> List[ProviderResponse]:
        logger.info(f"ProviderService: Listing providers (category={category}, limit={limit})")
        
        logger.info(f"Category filter applied: {category}")
        
        query = {}
        if category:
            query["category"] = category.value if hasattr(category, "value") else category
            
        logger.info(f"MongoDB query executed: {query}")
        
        providers = []
        try:
            cursor = db_client.db.providers.find(query).skip(skip).limit(limit)
            async for saved_provider in cursor:
                try:
                    mapped = await cls._map_provider_to_response(saved_provider)
                    providers.append(mapped)
                except Exception as e:
                    logger.exception(f"Failed to map provider document: {saved_provider}")
        except Exception as e:
            logger.exception("Database query in list_providers failed")
            
        logger.info(f"Number of providers found: {len(providers)}")
        return providers

    @classmethod
    async def update_provider(
        cls, 
        provider_id: str, 
        provider_update: ProviderUpdate
    ) -> Optional[ProviderResponse]:
        logger.info(f"ProviderService: Updating provider details for {provider_id}")
        provider_doc = None
        try:
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
        except Exception as e:
            logger.exception(f"Failed to update provider {provider_id}")
            return None

    @classmethod
    async def delete_provider(cls, provider_id: str) -> bool:
        logger.info(f"ProviderService: Deleting provider {provider_id}")
        query = {}
        try:
            if isinstance(provider_id, int) or (isinstance(provider_id, str) and provider_id.isdigit()):
                query = {"provider_id": int(provider_id)}
            elif isinstance(provider_id, str) and ObjectId.is_valid(provider_id):
                query = {"_id": ObjectId(provider_id)}
            else:
                return False

            result = await db_client.db.providers.delete_one(query)
            return result.deleted_count > 0
        except Exception as e:
            logger.exception(f"Failed to delete provider {provider_id}")
            return False
