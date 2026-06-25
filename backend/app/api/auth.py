from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from app.schemas.auth import UserRegister, UserLogin, UserResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user
from app.utils.response import standard_response

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_class=JSONResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister) -> JSONResponse:
    """
    Register a new user account.
    """
    if user_in.role == "admin" or (hasattr(user_in.role, "value") and user_in.role.value == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": "Admin accounts cannot be created through registration."
            }
        )
    user_data = await AuthService.register_user(user_in)
    return standard_response(
        success=True,
        message="User registered successfully.",
        data=user_data.model_dump(mode="json"),
        status_code=status.HTTP_201_CREATED
    )

@router.post("/login", response_class=JSONResponse)
async def login(login_in: UserLogin) -> JSONResponse:
    """
    Authenticate credentials and obtain bearer token.
    """
    token = await AuthService.authenticate(login_in)
    return standard_response(
        success=True,
        message="Authentication successful.",
        data=token.model_dump(mode="json")
    )

@router.get("/me", response_class=JSONResponse)
async def get_me(current_user: dict = Depends(get_current_user)) -> JSONResponse:
    """
    Retrieve profile details of the currently authenticated user.
    """
    user_data = await AuthService.get_user_by_id(current_user["id"])
    if not user_data:
        return standard_response(
            success=False,
            message="User profile not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )
    return standard_response(
        success=True,
        message="Profile details fetched successfully.",
        data=user_data.model_dump(mode="json")
    )
