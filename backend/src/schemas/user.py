"""User schemas."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


def rebuild_auth_response() -> None:
    """Rebuild AuthResponse after this module is imported."""
    from src.schemas.auth import _rebuild_auth_response

    _rebuild_auth_response()


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    """User creation schema."""

    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UserUpdate(BaseModel):
    """User update schema."""

    email: EmailStr | None = None
    full_name: str | None = None
    password: str | None = Field(None, min_length=8)


class UserResponse(UserBase):
    """User response schema."""

    id: str
    is_active: bool
    is_premium: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
