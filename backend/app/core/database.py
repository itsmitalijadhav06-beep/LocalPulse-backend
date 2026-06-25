import logging
from typing import Any, AsyncGenerator
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
        self.client: AsyncIOMotorClient = None
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
            logger.info("✅ Connected to MongoDB Atlas")
            logger.info(f"Database: {settings.MONGODB_DB_NAME}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise e

    async def close_database_connection(self) -> None:
        if self.client:
            logger.info("Closing MongoDB client connection...")
            self.client.close()
            logger.info("MongoDB connection closed.")

db_client = MongoDBManager()

async def get_db() -> AsyncGenerator[Any, None]:
    """
    Dependency generator for retrieval of database instance.
    """
    yield db_client.db
