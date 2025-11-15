"""Authentication service for user registration and login."""

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import User
from src.schemas.auth import LoginRequest, RegisterRequest
from src.schemas.user import UserResponse
from src.services import session_auth, user as user_service
from src.utils.security import verify_password


async def register_user(db: AsyncSession, register_data: RegisterRequest) -> tuple[User, str]:
    """Register a new user and create authentication session.

    Args:
        db: Database session
        register_data: Registration data

    Returns:
        Tuple of (created user, session_token)

    Raises:
        ValueError: If user with email already exists
    """
    user = await user_service.create_user(db, register_data)
    auth_session = await session_auth.create_auth_session(db, user)
    return user, auth_session.session_token


async def login_user(db: AsyncSession, login_data: LoginRequest) -> tuple[User, str]:
    """Authenticate user and create session.

    Args:
        db: Database session
        login_data: Login credentials

    Returns:
        Tuple of (user, session_token)

    Raises:
        ValueError: If email or password is incorrect
    """
    user = await user_service.get_user_by_email(db, login_data.email)
    if not user:
        raise ValueError("Invalid email or password")

    if not user.is_active:
        raise ValueError("User account is inactive")

    if not verify_password(login_data.password, user.hashed_password):
        raise ValueError("Invalid email or password")

    auth_session = await session_auth.create_auth_session(db, user)
    return user, auth_session.session_token


async def get_current_user(db: AsyncSession, session_token: str) -> User | None:
    """Get current user by session token.

    Args:
        db: Database session
        session_token: Session token

    Returns:
        User if session is valid, None otherwise
    """
    return await session_auth.get_user_by_session_token(db, session_token)
