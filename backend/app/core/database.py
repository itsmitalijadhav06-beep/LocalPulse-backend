import logging
from typing import Any, AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

class MongoDBManager:
    """
    Manager for MongoDB client connections.
    Provides lazy client initialization that does not block app startup.
    """
    def __init__(self) -> None:
        self.client: AsyncIOMotorClient = None
        self.db: Any = None

    async def connect_to_database(self) -> None:
        logger.info("Initializing MongoDB client...")
        try:
            # We initialize the client but skip pinging the server.
            # This allows the app to boot normally even if MongoDB is not running.
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI, 
                serverSelectionTimeoutMS=2000
            )
            self.db = self.client[settings.MONGODB_DB_NAME]
            logger.info("MongoDB client created successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB client: {e}")

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
