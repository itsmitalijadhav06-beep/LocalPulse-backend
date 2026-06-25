import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Custom HTTP middleware that inspects requests for authorization headers,
    performing lightweight logging or request decoration.
    """
    async def dispatch(
        self, 
        request: Request, 
        call_next: RequestResponseEndpoint
    ) -> Response:
        authorization: str = request.headers.get("Authorization", "")
        if authorization.startswith("Bearer "):
            logger.info(f"Incoming Bearer token request to: {request.url.path}")
        
        # Call the next middleware/route handler
        response = await call_next(request)
        return response
