import logging
from app.core.config import settings
from app.core.database import db_client
from app.schemas.system_config import SystemConfigUpdate, SystemConfigResponse

logger = logging.getLogger(settings.PROJECT_NAME)

DEFAULT_CONFIG = {
    "maintenance_mode": False,
    "allow_registration": True,
    "issue_auto_assignment": False,
    "max_upload_size_mb": 10,
    "default_search_radius_km": 5,
    "notifications_enabled": True,
    "provider_auto_approval": False,
    "event_creation_enabled": True,
}

class SystemConfigService:
    @classmethod
    async def get_config(cls) -> SystemConfigResponse:
        """
        Get the application-wide system configuration.
        Creates default values if none exist.
        """
        config_doc = await db_client.db.system_config.find_one({"_id": "config"})
        if not config_doc:
            logger.info("No system configuration found. Initializing with default values...")
            doc_to_insert = {"_id": "config", **DEFAULT_CONFIG}
            await db_client.db.system_config.insert_one(doc_to_insert)
            config_doc = doc_to_insert

        return SystemConfigResponse(
            maintenance_mode=config_doc.get("maintenance_mode", DEFAULT_CONFIG["maintenance_mode"]),
            allow_registration=config_doc.get("allow_registration", DEFAULT_CONFIG["allow_registration"]),
            issue_auto_assignment=config_doc.get("issue_auto_assignment", DEFAULT_CONFIG["issue_auto_assignment"]),
            max_upload_size_mb=config_doc.get("max_upload_size_mb", DEFAULT_CONFIG["max_upload_size_mb"]),
            default_search_radius_km=config_doc.get("default_search_radius_km", DEFAULT_CONFIG["default_search_radius_km"]),
            notifications_enabled=config_doc.get("notifications_enabled", DEFAULT_CONFIG["notifications_enabled"]),
            provider_auto_approval=config_doc.get("provider_auto_approval", DEFAULT_CONFIG["provider_auto_approval"]),
            event_creation_enabled=config_doc.get("event_creation_enabled", DEFAULT_CONFIG["event_creation_enabled"]),
        )

    @classmethod
    async def update_config(cls, config_in: SystemConfigUpdate) -> SystemConfigResponse:
        """
        Updates the application-wide system configuration.
        """
        logger.info("SystemConfigService: Updating application configuration...")
        update_data = config_in.model_dump()
        
        from pymongo import ReturnDocument
        updated_doc = await db_client.db.system_config.find_one_and_update(
            {"_id": "config"},
            {"$set": update_data},
            upsert=True,
            return_document=ReturnDocument.AFTER
        )
        
        return SystemConfigResponse(
            maintenance_mode=updated_doc.get("maintenance_mode", DEFAULT_CONFIG["maintenance_mode"]),
            allow_registration=updated_doc.get("allow_registration", DEFAULT_CONFIG["allow_registration"]),
            issue_auto_assignment=updated_doc.get("issue_auto_assignment", DEFAULT_CONFIG["issue_auto_assignment"]),
            max_upload_size_mb=updated_doc.get("max_upload_size_mb", DEFAULT_CONFIG["max_upload_size_mb"]),
            default_search_radius_km=updated_doc.get("default_search_radius_km", DEFAULT_CONFIG["default_search_radius_km"]),
            notifications_enabled=updated_doc.get("notifications_enabled", DEFAULT_CONFIG["notifications_enabled"]),
            provider_auto_approval=updated_doc.get("provider_auto_approval", DEFAULT_CONFIG["provider_auto_approval"]),
            event_creation_enabled=updated_doc.get("event_creation_enabled", DEFAULT_CONFIG["event_creation_enabled"]),
        )
