"""User endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db
from src.db.models import User
from src.schemas.user import UserResponse, UserUpdate
from src.services import user as user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current user profile.

    Args:
        current_user: Current authenticated user

    Returns:
        Current user data
    """
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update current user profile.

    Args:
        user_data: User update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user data

    Raises:
        HTTPException: If email already exists or validation fails
    """
    try:
        updated_user = await user_service.update_user(db, current_user, user_data)
        return UserResponse.model_validate(updated_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete current user account.

    Args:
        current_user: Current authenticated user
        db: Database session
    """
    await user_service.delete_user(db, current_user)
