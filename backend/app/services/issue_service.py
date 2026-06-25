import logging
from typing import List, Optional
from datetime import datetime, timezone
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from app.core.constants import IssueStatus
from app.core.config import settings

logger = logging.getLogger(settings.PROJECT_NAME)

class IssueService:
    """
    Placeholder service for managing community issue reports.
    """
    @classmethod
    async def create_issue(cls, issue_in: IssueCreate, reporter_id: str) -> IssueResponse:
        logger.info(f"IssueService: Creating new issue titled '{issue_in.title}' by reporter {reporter_id}")
        return IssueResponse(
            id="iss_mock123",
            title=issue_in.title,
            description=issue_in.description,
            category=issue_in.category,
            status=IssueStatus.REPORTED,
            reporter_id=reporter_id,
            assigned_provider_id=None,
            latitude=issue_in.latitude,
            longitude=issue_in.longitude,
            image_url=issue_in.image_url,
            upvotes=0,
            subscribers=[reporter_id],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

    @classmethod
    async def get_issue_by_id(cls, issue_id: str) -> Optional[IssueResponse]:
        logger.info(f"IssueService: Getting issue {issue_id}")
        return IssueResponse(
            id=issue_id,
            title="Mock Issue Title",
            description="Mock issue description details.",
            category="roads",
            status=IssueStatus.REPORTED,
            reporter_id="usr_reporter_mock",
            assigned_provider_id=None,
            latitude=0.0,
            longitude=0.0,
            image_url=None,
            upvotes=5,
            subscribers=["usr_reporter_mock"],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

    @classmethod
    async def list_issues(cls, limit: int = 10, skip: int = 0) -> List[IssueResponse]:
        logger.info(f"IssueService: Listing issues (limit={limit}, skip={skip})")
        return [
            IssueResponse(
                id="iss_mock1",
                title="Broken Street Light",
                description="Street light flickering on Oak Street.",
                category="utilities",
                status=IssueStatus.REPORTED,
                reporter_id="usr_reporter1",
                latitude=40.7128,
                longitude=-74.0060,
                upvotes=2,
                subscribers=[],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
        ]

    @classmethod
    async def update_issue(cls, issue_id: str, issue_update: IssueUpdate) -> Optional[IssueResponse]:
        logger.info(f"IssueService: Updating issue {issue_id}")
        return IssueResponse(
            id=issue_id,
            title=issue_update.title or "Updated Issue Title",
            description=issue_update.description or "Updated issue description.",
            category=issue_update.category or "utilities",
            status=issue_update.status or IssueStatus.IN_PROGRESS,
            reporter_id="usr_reporter_mock",
            assigned_provider_id=issue_update.assigned_provider_id,
            latitude=0.0,
            longitude=0.0,
            image_url=issue_update.image_url,
            upvotes=5,
            subscribers=[],
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )

    @classmethod
    async def upvote_issue(cls, issue_id: str, user_id: str) -> Optional[IssueResponse]:
        logger.info(f"IssueService: User {user_id} upvoting issue {issue_id}")
        return await cls.get_issue_by_id(issue_id)

    @classmethod
    async def subscribe_issue(cls, issue_id: str, user_id: str) -> Optional[IssueResponse]:
        logger.info(f"IssueService: User {user_id} subscribing to notifications on issue {issue_id}")
        issue = await cls.get_issue_by_id(issue_id)
        if issue and user_id not in issue.subscribers:
            issue.subscribers.append(user_id)
        return issue
