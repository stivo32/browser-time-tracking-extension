"""Security utilities for password hashing and session tokens."""

import secrets
from datetime import UTC, datetime, timedelta

import bcrypt

from src.config import settings


def hash_password(password: str) -> str:
    """Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password to verify against

    Returns:
        True if password matches, False otherwise
    """
    try:
        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def generate_session_token() -> str:
    """Generate a secure random session token.

    Returns:
        URL-safe random token (32 bytes = 43 characters)
    """
    return secrets.token_urlsafe(32)


def get_session_expires_at(days: int | None = None) -> datetime:
    """Get expiration datetime for a session.

    Args:
        days: Number of days until expiration. If None, uses settings.SESSION_EXPIRE_DAYS

    Returns:
        Datetime when session expires
    """
    if days is None:
        days = settings.session_expire_days
    return datetime.now(UTC) + timedelta(days=days)


def is_session_expired(expires_at: datetime) -> bool:
    """Check if a session has expired.

    Args:
        expires_at: Session expiration datetime

    Returns:
        True if session is expired, False otherwise
    """
    now = datetime.now(UTC)
    # Приводим expires_at к UTC если нужно
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    return now >= expires_at
