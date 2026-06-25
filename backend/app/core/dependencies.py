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
    Injects the current user dictionary upon validation success after looking up the database.
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
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing subject information.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.core.database import db_client
    from bson import ObjectId

    user_doc = None
    try:
        if ObjectId.is_valid(user_id):
            user_doc = await db_client.db.users.find_one({"_id": ObjectId(user_id)})
        else:
            if isinstance(user_id, int) or (isinstance(user_id, str) and user_id.isdigit()):
                user_doc = await db_client.db.users.find_one({"user_id": int(user_id)})
    except Exception as e:
        logger.error(f"Error fetching user from DB: {e}")

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role = user_doc.get("role", UserRole.CITIZEN.value)
    if hasattr(role, "value"):
        role = role.value

    return {
        "id": str(user_doc["_id"]),
        "email": user_doc.get("email"),
        "role": role,
        "is_active": user_doc.get("is_active", True)
    }

def require_role(allowed_roles: List[str]):
    """
    Dependency factory to check if the current user has any of the specified roles.
    """
    async def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            logger.warning(f"Access forbidden: User {current_user.get('id')} with role '{user_role}' tried to access restricted route.")
            if "admin" in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "success": False,
                        "message": "Admin access required."
                    }
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "message": "Access forbidden."
                }
            )
        return current_user
    return dependency

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
