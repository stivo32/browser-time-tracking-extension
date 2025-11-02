"""Authentication schemas."""

from typing import TYPE_CHECKING

from pydantic import BaseModel, EmailStr, Field

if TYPE_CHECKING:
    from src.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    """User registration request."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str | None = Field(None, max_length=255)


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr
    password: str


class AuthSessionResponse(BaseModel):
    """Authentication session response with token."""

    session_token: str
    expires_at: str  # ISO format datetime string
    user_id: str

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response."""

    session: AuthSessionResponse
    user: "UserResponse"


def _rebuild_auth_response() -> None:
    """Rebuild AuthResponse model after UserResponse is defined.

    This is needed because AuthResponse uses forward reference "UserResponse",
    and model_rebuild() must be called after UserResponse is imported to resolve it.
    """
    from src.schemas.user import UserResponse  # noqa: F401

    AuthResponse.model_rebuild()
