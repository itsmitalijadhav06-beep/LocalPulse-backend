import logging
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException, status
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.core.constants import UserRole
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.core.database import db_client

logger = logging.getLogger(settings.PROJECT_NAME)

class AuthService:
    """
    Service for handling authentication and user registration logic with MongoDB.
    """
    @classmethod
    async def register_user(cls, user_in: UserRegister) -> UserResponse:
        logger.info(f"AuthService: Registering user with email {user_in.email}")
        
        # Check duplicate email
        logger.info("Checking existing user...")
        existing_user = await db_client.db.users.find_one({"email": user_in.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )
            
        logger.info("Hashing password...")
        hashed_password = get_password_hash(user_in.password)
        
        from app.core.database import get_next_sequence_value
        user_id = await get_next_sequence_value("users")
        
        user_document = {
            "user_id": user_id,
            "email": user_in.email,
            "password": hashed_password,
            "full_name": user_in.full_name,
            "role": user_in.role.value if hasattr(user_in.role, 'value') else user_in.role,
            "phone_number": user_in.phone_number,
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        }
        
        logger.info("Inserting user...")
        result = await db_client.db.users.insert_one(user_document)
        print(result.inserted_id)
        logger.info(f"Inserted ObjectId: {result.inserted_id}")
        logger.info("MongoDB insert successful.")
        
        saved_user = await db_client.db.users.find_one(
            {"_id": result.inserted_id}
        )
        print(saved_user)
        logger.info("Registration completed.")
        
        return UserResponse(
            id=saved_user["user_id"],
            email=saved_user["email"],
            full_name=saved_user["full_name"],
            role=saved_user["role"],
            phone_number=saved_user.get("phone_number"),
            is_active=saved_user.get("is_active", True),
            created_at=saved_user["created_at"]
        )

    @classmethod
    async def authenticate(cls, login_in: UserLogin) -> Token:
        logger.info(f"AuthService: Authenticating user email {login_in.email}")
        
        user_doc = await db_client.db.users.find_one({"email": login_in.email})
        if not user_doc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
            
        if not verify_password(login_in.password, user_doc["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
            
        # Generate token with user's actual MongoDB ObjectId as string
        token_data = {
            "sub": str(user_doc["_id"]),
            "email": user_doc["email"],
            "role": user_doc["role"]
        }
        access_token = create_access_token(token_data)
        
        return Token(
            access_token=access_token,
            token_type="bearer"
        )

    @classmethod
    async def get_user_by_id(cls, user_id: str) -> Optional[UserResponse]:
        logger.info(f"AuthService: Fetching user details for {user_id}")
        user_doc = None
        
        if isinstance(user_id, int) or (isinstance(user_id, str) and user_id.isdigit()):
            user_doc = await db_client.db.users.find_one({"user_id": int(user_id)})
        elif isinstance(user_id, str) and ObjectId.is_valid(user_id):
            user_doc = await db_client.db.users.find_one({"_id": ObjectId(user_id)})
            
        if not user_doc:
            return None
            
        return UserResponse(
            id=user_doc["user_id"],
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            role=user_doc["role"],
            phone_number=user_doc.get("phone_number"),
            is_active=user_doc.get("is_active", True),
            created_at=user_doc["created_at"]
        )
