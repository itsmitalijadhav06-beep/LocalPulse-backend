import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings, setup_logging
from app.core.database import db_client
from app.middleware.auth import AuthenticationMiddleware
from app.middleware.error_handler import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)

# Import all API sub-routers
from app.api.auth import router as auth_router
from app.api.issues import router as issues_router
from app.api.comments import router as comments_router
from app.api.events import router as events_router
from app.api.providers import router as providers_router
from app.api.notifications import router as notifications_router
from app.api.dashboard import router as dashboard_router
from app.api.admin import router as admin_router

# Setup application logging
setup_logging()
logger = logging.getLogger(settings.PROJECT_NAME)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    FastAPI Lifespan handler that oversees server boot and shutdown procedures.
    """
    logger.info("Starting up LocalPulse backend service...")
    # Initialize the MongoDB client
    await db_client.connect_to_database()
    yield
    logger.info("Shutting down LocalPulse backend service...")
    # Close the MongoDB client
    await db_client.close_database_connection()


# Initialize the main FastAPI application instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready decoupled API boilerplate backend for LocalPulse.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS Middleware
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"CORS origins configured: {settings.CORS_ORIGINS}")

# Configure Custom Authentication Interceptor Middleware
app.add_middleware(AuthenticationMiddleware)

# Bind Exception Handlers to standard and custom exceptions
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Include all API Routers under a central versioned prefix
api_v1_prefix = settings.API_V1_STR

app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(issues_router, prefix=api_v1_prefix)
app.include_router(comments_router, prefix=api_v1_prefix)
app.include_router(events_router, prefix=api_v1_prefix)
app.include_router(providers_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)
app.include_router(dashboard_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)

# Health Check Route
@app.get("/health", tags=["Health"], status_code=status.HTTP_200_OK)
async def health_check() -> dict:
    """
    Standard health check endpoint to check server availability.
    """
    return {
        "status": "healthy",
        "app_name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": settings.ENV
    }
