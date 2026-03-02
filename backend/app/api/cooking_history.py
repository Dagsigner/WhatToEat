"""Cooking history API router — recent cooking history endpoint."""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_cooking_history_service, get_current_user
from app.models.user import User
from app.schemas.cooking_history import CookingHistoryRecentResponse, CookingHistoryRecipeInfo
from app.services.cooking_history import CookingHistoryService

router = APIRouter(prefix="/cooking-history", tags=["cooking-history"])


@router.get("/recent", response_model=list[CookingHistoryRecentResponse], status_code=200)
async def get_recent_history(
    current_user: User = Depends(get_current_user),
    service: CookingHistoryService = Depends(get_cooking_history_service),
) -> list[CookingHistoryRecentResponse]:
    records = await service.list_recent(current_user.id)
    return [
        CookingHistoryRecentResponse(
            id=record.id,
            cooked_at=record.cooked_at,
            recipe=CookingHistoryRecipeInfo(
                id=record.recipe.id,
                title=record.recipe.title,
                photo_url=record.recipe.photo_url,
            ),
        )
        for record in records
    ]
