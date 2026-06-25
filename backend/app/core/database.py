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

async def get_db() -> AsyncGenerator[Any, None]:
    """
    Dependency generator for retrieval of database instance.
    """
    yield db_client.db
