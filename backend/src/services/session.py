"""Session (tracking) service for managing time tracking sessions."""

from datetime import date as date_type

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Session
from src.schemas.session import SessionCreate, SessionUpdate


async def get_session_by_id(db: AsyncSession, session_id: str, user_id: str) -> Session | None:
    """Get session by ID for a specific user.

    Args:
        db: Database session
        session_id: Session ID
        user_id: User ID (for authorization)

    Returns:
        Session if found and belongs to user, None otherwise
    """
    result = await db.execute(select(Session).where(Session.id == session_id, Session.user_id == user_id))
    return result.scalar_one_or_none()


async def get_session_by_date(db: AsyncSession, user_id: str, date: date_type) -> Session | None:
    """Get session by date for a specific user.

    Args:
        db: Database session
        user_id: User ID
        date: Session date

    Returns:
        Session if found, None otherwise
    """
    result = await db.execute(select(Session).where(Session.user_id == user_id, Session.date == date))
    return result.scalar_one_or_none()


async def get_user_sessions(
    db: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
) -> list[Session]:
    """Get list of sessions for a user with pagination.

    Args:
        db: Database session
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of sessions
    """
    result = await db.execute(
        select(Session).where(Session.user_id == user_id).order_by(Session.date.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def count_user_sessions(db: AsyncSession, user_id: str) -> int:
    """Count total number of sessions for a user.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Total number of sessions
    """
    from sqlalchemy import func

    result = await db.execute(select(func.count(Session.id)).where(Session.user_id == user_id))
    return result.scalar_one() or 0


async def create_session(db: AsyncSession, user_id: str, session_data: SessionCreate) -> Session:
    """Create a new tracking session.

    Args:
        db: Database session
        user_id: User ID
        session_data: Session creation data

    Returns:
        Created session

    Raises:
        ValueError: If session for this date already exists
    """
    existing_session = await get_session_by_date(db, user_id, session_data.date)
    if existing_session:
        raise ValueError(f"Session for date {session_data.date} already exists")

    session = Session(user_id=user_id, date=session_data.date)

    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def update_session(db: AsyncSession, session: Session, session_data: SessionUpdate) -> Session:
    """Update a tracking session.

    Args:
        db: Database session
        session: Session to update
        session_data: Session update data

    Returns:
        Updated session

    Raises:
        ValueError: If session for new date already exists
    """
    if session_data.date is not None and session_data.date != session.date:
        existing_session = await get_session_by_date(db, session.user_id, session_data.date)
        if existing_session:
            raise ValueError(f"Session for date {session_data.date} already exists")
        session.date = session_data.date

    await db.commit()
    await db.refresh(session)
    return session


async def delete_session(db: AsyncSession, session: Session) -> None:
    """Delete a tracking session.

    Args:
        db: Database session
        session: Session to delete
    """
    await db.delete(session)
    await db.commit()
