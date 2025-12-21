"""Authentication endpoints."""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import SESSION_TOKEN_HEADER, get_current_user, get_db
from src.db.models import User
from src.schemas.auth import AuthResponse, AuthSessionResponse, LoginRequest, RegisterRequest
from src.schemas.user import UserResponse
from src.services import auth as auth_service
from src.services import session_auth

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    register_data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Register a new user and create authentication session.

    Args:
        register_data: User registration data
        db: Database session

    Returns:
        Authentication response with session token and user data

    Raises:
        HTTPException: If user with email already exists
    """
    try:
        user, session_token = await auth_service.register_user(db, register_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    auth_session = await session_auth.get_auth_session_by_token(db, session_token)
    if not auth_session:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session",
        )

    session_response = AuthSessionResponse(
        session_token=auth_session.session_token,
        expires_at=auth_session.expires_at.isoformat(),
        user_id=str(auth_session.user_id),
    )

    return AuthResponse(
        session=session_response,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Authenticate user and create session.

    Args:
        login_data: User login credentials
        db: Database session

    Returns:
        Authentication response with session token and user data

    Raises:
        HTTPException: If email or password is incorrect
    """
    try:
        user, session_token = await auth_service.login_user(db, login_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Session"},
        ) from e

    auth_session = await session_auth.get_auth_session_by_token(db, session_token)
    if not auth_session:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session",
        )

    session_response = AuthSessionResponse(
        session_token=auth_session.session_token,
        expires_at=auth_session.expires_at.isoformat(),
        user_id=str(auth_session.user_id),
    )

    return AuthResponse(
        session=session_response,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_session_token: str | None = Header(None, alias=SESSION_TOKEN_HEADER),
) -> None:
    """Logout current user by deleting session.

    Args:
        current_user: Current authenticated user
        db: Database session
        x_session_token: Session token from header
    """
    if x_session_token:
        await session_auth.delete_auth_session_by_token(db, x_session_token)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current authenticated user.

    Args:
        current_user: Current authenticated user

    Returns:
        Current user data
    """
    return UserResponse.model_validate(current_user)
