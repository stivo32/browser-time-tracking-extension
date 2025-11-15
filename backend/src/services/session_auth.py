"""Authentication session service for managing user sessions."""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import AuthSession, User
from src.utils.security import generate_session_token, get_session_expires_at, is_session_expired


async def create_auth_session(db: AsyncSession, user: User) -> AuthSession:
    """Create a new authentication session for a user.

    Args:
        db: Database session
        user: User to create session for

    Returns:
        Created authentication session
    """
    session_token = generate_session_token()
    expires_at = get_session_expires_at()

    auth_session = AuthSession(
        user_id=user.id,
        session_token=session_token,
        expires_at=expires_at,
    )

    db.add(auth_session)
    await db.commit()
    await db.refresh(auth_session)
    return auth_session


async def get_auth_session_by_token(db: AsyncSession, session_token: str) -> AuthSession | None:
    """Get authentication session by token.

    Args:
        db: Database session
        session_token: Session token

    Returns:
        Authentication session if found and not expired, None otherwise
    """
    result = await db.execute(select(AuthSession).where(AuthSession.session_token == session_token))
    auth_session = result.scalar_one_or_none()

    if auth_session and is_session_expired(auth_session.expires_at):
        await delete_auth_session(db, auth_session)
        return None

    if auth_session:
        auth_session.last_used_at = datetime.now(UTC)
        await db.commit()

    return auth_session


async def get_user_by_session_token(db: AsyncSession, session_token: str) -> User | None:
    """Get user by session token.

    Args:
        db: Database session
        session_token: Session token

    Returns:
        User if session is valid, None otherwise
    """
    auth_session = await get_auth_session_by_token(db, session_token)
    if not auth_session:
        return None

    result = await db.execute(select(User).where(User.id == auth_session.user_id))
    return result.scalar_one_or_none()


async def delete_auth_session(db: AsyncSession, auth_session: AuthSession) -> None:
    """Delete an authentication session.

    Args:
        db: Database session
        auth_session: Authentication session to delete
    """
    await db.delete(auth_session)
    await db.commit()


async def delete_auth_session_by_token(db: AsyncSession, session_token: str) -> None:
    """Delete an authentication session by token.

    Args:
        db: Database session
        session_token: Session token
    """
    auth_session = await get_auth_session_by_token(db, session_token)
    if auth_session:
        await delete_auth_session(db, auth_session)


async def cleanup_expired_sessions(db: AsyncSession) -> int:
    """Clean up expired authentication sessions.

    Args:
        db: Database session

    Returns:
        Number of deleted sessions
    """
    now = datetime.now(UTC)
    result = await db.execute(select(AuthSession).where(AuthSession.expires_at < now))
    expired_sessions = result.scalars().all()

    count = len(expired_sessions)
    for session in expired_sessions:
        await db.delete(session)

    await db.commit()
    return count
