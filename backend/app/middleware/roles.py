import logging
from typing import List
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

class RoleVerification:
    """
    Auxiliary validation logic for role check operations outside FastAPI dependencies.
    Useful for backend tasks, socket connections, or manual script authorization checks.
    """
    @staticmethod
    def has_required_role(user_role: str, required_roles: List[str]) -> bool:
        logger.info(f"Verifying access: Role '{user_role}' checking against {required_roles}")
        return user_role in required_roles
