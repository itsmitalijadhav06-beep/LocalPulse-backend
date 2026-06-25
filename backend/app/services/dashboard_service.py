import logging
from typing import Any
from datetime import datetime, timezone
from bson import ObjectId
from app.core.config import settings
from app.core.database import db_client

logger = logging.getLogger(settings.PROJECT_NAME)

class DashboardService:
    """
    Service for calculating analytics and feed summaries using MongoDB.
    """
    @classmethod
    async def get_citizen_summary(cls, latitude: float, longitude: float, radius_km: float) -> dict:
        logger.info(f"DashboardService: Generating citizen feed summary for coordinates: ({latitude}, {longitude}) within {radius_km}km")
        
        # Count recent issues near user or globally
        geo_query: dict[str, Any] = {}
        if latitude != 0.0 or longitude != 0.0:
            geo_query = {
                "location": {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [longitude, latitude]
                        },
                        "$maxDistance": radius_km * 1000
                    }
                }
            }
            
        try:
            recent_count = await db_client.db.issues.count_documents(geo_query)
        except Exception:
            recent_count = await db_client.db.issues.count_documents({})
            
        # Count resolved issues
        resolved_query: dict[str, Any] = {"status": "resolved"}
        if geo_query:
            resolved_query.update(geo_query)
            
        try:
            resolved_count = await db_client.db.issues.count_documents(resolved_query)
        except Exception:
            resolved_count = await db_client.db.issues.count_documents({"status": "resolved"})
            
        # Upcoming events (event_date >= now)
        now = datetime.now(timezone.utc)
        events_query = {"event_date": {"$gte": now}}
        upcoming_events_count = await db_client.db.events.count_documents(events_query)
        
        # Nearby providers
        providers_count = await db_client.db.providers.count_documents({})
        
        return {
            "recent_issues_count": recent_count,
            "resolved_issues_count": resolved_count,
            "upcoming_events_count": upcoming_events_count,
            "nearby_providers_count": providers_count,
            "radius_km": radius_km
        }

    @classmethod
    async def get_provider_summary(cls, provider_id: str) -> dict:
        logger.info(f"DashboardService: Fetching provider stats summary for {provider_id}")
        
        prov_obj_id = None
        if provider_id:
            if isinstance(provider_id, int) or (isinstance(provider_id, str) and provider_id.isdigit()):
                provider_doc = await db_client.db.providers.find_one({"provider_id": int(provider_id)})
                if provider_doc:
                    prov_obj_id = provider_doc["_id"]
            elif isinstance(provider_id, str) and ObjectId.is_valid(provider_id):
                prov_obj_id = ObjectId(provider_id)
        
        if not prov_obj_id:
            prov_obj_id = ObjectId()
            
        assigned_issues_count = await db_client.db.issues.count_documents({"assigned_provider_id": prov_obj_id})
        in_progress_issues_count = await db_client.db.issues.count_documents({"assigned_provider_id": prov_obj_id, "status": "in_progress"})
        resolved_issues_count = await db_client.db.issues.count_documents({"assigned_provider_id": prov_obj_id, "status": "resolved"})
        
        # Get provider average rating
        avg_rating = 5.0
        try:
            provider = await db_client.db.providers.find_one({"_id": prov_obj_id})
            if provider:
                avg_rating = provider.get("rating", 5.0)
        except Exception:
            pass
            
        return {
            "assigned_issues_count": assigned_issues_count,
            "in_progress_issues_count": in_progress_issues_count,
            "resolved_issues_count": resolved_issues_count,
            "average_rating": avg_rating,
            "pending_invoices_count": 0
        }

    @classmethod
    async def get_admin_summary(cls) -> dict:
        logger.info("DashboardService: Creating administrator global stats summary")
        
        total_users = await db_client.db.users.count_documents({})
        total_issues = await db_client.db.issues.count_documents({})
        open_issues = await db_client.db.issues.count_documents({"status": "Open"})
        resolved_issues = await db_client.db.issues.count_documents({"status": "resolved"})
        total_events = await db_client.db.events.count_documents({})
        total_providers = await db_client.db.providers.count_documents({})
        total_comments = await db_client.db.comments.count_documents({})
        
        return {
            "total_users": total_users,
            "total_issues": total_issues,
            "open_issues": open_issues,
            "resolved_issues": resolved_issues,
            "total_events": total_events,
            "total_providers": total_providers,
            "total_comments": total_comments
        }
