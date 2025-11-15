"""FastAPI dependencies for authentication and database."""

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.database import get_db
from src.db.models import User
from src.services import auth as auth_service

SESSION_TOKEN_HEADER = "X-Session-Token"


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    session_token: str | None = Header(None, alias=SESSION_TOKEN_HEADER),
) -> User:
    """Get current authenticated user from session token.

    Args:
        db: Database session
        session_token: Session token from header

    Returns:
        Current authenticated user

    Raises:
        HTTPException: If session token is missing or invalid
    """
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is required",
            headers={"WWW-Authenticate": "Session"},
        )

    user = await auth_service.get_current_user(db, session_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
            headers={"WWW-Authenticate": "Session"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return user


async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    session_token: str | None = Header(None, alias=SESSION_TOKEN_HEADER),
) -> User | None:
    """Get current user if session token is provided, otherwise return None.

    Args:
        db: Database session
        session_token: Session token from header (optional)

    Returns:
        Current user if authenticated, None otherwise
    """
    if not session_token:
        return None

    return await auth_service.get_current_user(db, session_token)
