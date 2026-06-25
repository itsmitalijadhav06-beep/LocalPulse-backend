import logging
from typing import Optional
from datetime import datetime, timezone
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.core.constants import UserRole
from app.core.security import get_password_hash, create_access_token
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

class AuthService:
    """
    Placeholder service for handling authentication and user registration logic.
    """
    @classmethod
    async def register_user(cls, user_in: UserRegister) -> UserResponse:
        logger.info(f"AuthService: Registering user with email {user_in.email}")
        
        # Hash password (placeholder action)
        hashed = get_password_hash(user_in.password)
        
        # Return a mock registered user response
        return UserResponse(
            id="usr_mock12345",
            email=user_in.email,
            full_name=user_in.full_name,
            role=user_in.role,
            phone_number=user_in.phone_number,
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )

    @classmethod
    async def authenticate(cls, login_in: UserLogin) -> Token:
        logger.info(f"AuthService: Authenticating user email {login_in.email}")
        
        # Generate placeholder JWT token
        token_data = {
            "sub": "usr_mock12345",
            "email": login_in.email,
            "role": UserRole.CITIZEN.value
        }
        access_token = create_access_token(token_data)
        
        return Token(
            access_token=access_token,
            token_type="bearer"
        )

    @classmethod
    async def get_user_by_id(cls, user_id: str) -> Optional[UserResponse]:
        logger.info(f"AuthService: Fetching user details for {user_id}")
        return UserResponse(
            id=user_id,
            email="user@localpulse.org",
            full_name="Mock User",
            role=UserRole.CITIZEN,
            phone_number="+1234567890",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
