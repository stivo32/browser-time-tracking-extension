"""Pydantic schemas for API validation."""

from src.schemas.auth import AuthResponse, AuthSessionResponse, LoginRequest, RegisterRequest
from src.schemas.domain import DomainCreate, DomainResponse, DomainStats, DomainUpdate
from src.schemas.page import PageCreate, PageResponse, PageUpdate
from src.schemas.session import SessionCreate, SessionResponse, SessionUpdate
from src.schemas.user import UserCreate, UserResponse, UserUpdate, rebuild_auth_response

rebuild_auth_response()

__all__ = [
    "AuthResponse",
    "AuthSessionResponse",
    "LoginRequest",
    "RegisterRequest",
    "UserCreate",
    "UserResponse",
    "UserUpdate",
    "SessionCreate",
    "SessionResponse",
    "SessionUpdate",
    "DomainCreate",
    "DomainResponse",
    "DomainStats",
    "DomainUpdate",
    "PageCreate",
    "PageResponse",
    "PageUpdate",
]
