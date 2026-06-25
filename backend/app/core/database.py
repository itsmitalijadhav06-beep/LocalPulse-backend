import logging
from typing import Any, AsyncGenerator, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

def get_redacted_uri(uri: str) -> str:
    if "@" in uri:
        parts = uri.rsplit("@", 1)
        prefix_part = parts[0]
        for scheme in ["mongodb+srv://", "mongodb://"]:
            if prefix_part.startswith(scheme):
                creds = prefix_part[len(scheme):]
                if ":" in creds:
                    user, pwd = creds.split(":", 1)
                    return f"{scheme}{user}:*****@{parts[1]}"
                break
    return uri

class MongoDBManager:
    """
    Manager for MongoDB client connections.
    """
    def __init__(self) -> None:
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Any = None

    async def connect_to_database(self) -> None:
        redacted_uri = get_redacted_uri(settings.MONGODB_URI)
        print(f"Mongo URI (without password): {redacted_uri}")
        print(f"Database name: {settings.MONGODB_DB_NAME}")
        logger.info("Initializing MongoDB client...")
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            # Fail startup if MongoDB cannot be reached
            await self.client.admin.command("ping")
            self.db = self.client[settings.MONGODB_DB_NAME]
            
            # Create geospatial indexes
            await self.db.issues.create_index([("location", "2dsphere")])
            await self.db.events.create_index([("location", "2dsphere")])
            
            logger.info("✅ Connected to MongoDB Atlas")
            logger.info(f"Database: {settings.MONGODB_DB_NAME}")
            await run_startup_migrations()
            await create_default_admin()
            await initialize_system_config()
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise e

    async def close_database_connection(self) -> None:
        if self.client:
            logger.info("Closing MongoDB client connection...")
            self.client.close()
            logger.info("MongoDB connection closed.")

db_client = MongoDBManager()

async def get_next_sequence_value(sequence_name: str) -> int:
    """
    Increments and returns the next sequence number for a collection.
    """
    from pymongo import ReturnDocument
    sequence_document = await db_client.db.counters.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return sequence_document["seq"]

async def run_startup_migrations() -> None:
    """
    Ensures legacy documents without sequential IDs are backfilled.
    """
    logger.info("Running startup migrations for sequential IDs...")
    collections_and_ids = {
        "users": "user_id",
        "issues": "issue_id",
        "events": "event_id",
        "providers": "provider_id",
        "comments": "comment_id",
        "notifications": "notification_id",
    }
    for coll_name, id_field in collections_and_ids.items():
        collection = db_client.db[coll_name]
        cursor = collection.find({id_field: {"$exists": False}})
        async for doc in cursor:
            seq_val = await get_next_sequence_value(coll_name)
            await collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {id_field: seq_val}}
            )
            logger.info(f"Assigned sequential ID {seq_val} ({id_field}) to {coll_name} doc {doc['_id']}")
    logger.info("Startup migrations completed.")

async def create_default_admin() -> None:
    """
    Checks if an admin user exists in the database.
    If not, creates the default admin user with password Admin@123 hashed using bcrypt.
    """
    existing_admin = await db_client.db.users.find_one({"role": "admin"})
    if existing_admin:
        logger.info("Admin user already exists. Skipping default admin creation.")
        return

    logger.info("No admin user found. Creating default administrator...")
    from datetime import datetime, timezone
    from app.core.security import get_password_hash
    
    hashed_password = get_password_hash("Admin@123")
    user_id = await get_next_sequence_value("users")
    
    admin_doc = {
        "user_id": user_id,
        "email": "admin@localpulse.com",
        "password": hashed_password,
        "full_name": "System Administrator",
        "role": "admin",
        "phone_number": "9999999999",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db_client.db.users.insert_one(admin_doc)
    logger.info("✅ Default admin user created successfully.")

async def initialize_system_config() -> None:
    """
    Checks if a system configuration document exists in the database.
    If not, creates the default system configuration.
    """
    existing_config = await db_client.db.system_config.find_one({"_id": "config"})
    if existing_config:
        logger.info("System configuration already exists. Skipping initialization.")
        return

    logger.info("No system configuration found. Initializing default configuration...")
    default_config = {
        "_id": "config",
        "maintenance_mode": False,
        "allow_registration": True,
        "issue_auto_assignment": False,
        "max_upload_size_mb": 10,
        "default_search_radius_km": 5,
        "notifications_enabled": True,
        "provider_auto_approval": False,
        "event_creation_enabled": True,
    }
    await db_client.db.system_config.insert_one(default_config)
    logger.info("✅ Default system configuration initialized successfully.")

async def get_db() -> AsyncGenerator[Any, None]:
    """
    Dependency generator for retrieval of database instance.
    """
    yield db_client.db
