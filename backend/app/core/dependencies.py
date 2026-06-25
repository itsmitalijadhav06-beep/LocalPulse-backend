import logging
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.security import decode_access_token
from app.core.constants import UserRole

logger = logging.getLogger(settings.PROJECT_NAME)

# Use HTTPBearer scheme for JWT authentication
security_scheme = HTTPBearer(auto_error=True)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> dict:
    """
    FastAPI dependency that extracts and validates the JWT bearer token.
    Injects the current user dictionary upon validation success.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or session has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role", UserRole.CITIZEN.value)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing subject information.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Return current user info
    return {
        "id": user_id,
        "email": email,
        "role": role,
        "is_active": True
    }

class RoleChecker:
    """
    Dependency factory to check if the current user has any of the specified roles.
    """
    def __init__(self, allowed_roles: List[UserRole]) -> None:
        self.allowed_roles = [role.value if isinstance(role, UserRole) else role for role in allowed_roles]

    def __call__(self, current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in self.allowed_roles:
            logger.warning(f"Access forbidden: User {current_user.get('id')} with role '{user_role}' tried to access role restricted route.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have the required permissions to perform this action."
            )
        return current_user
