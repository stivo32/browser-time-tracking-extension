"""Session (tracking) endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db
from src.db.models import User
from src.schemas.session import SessionCreate, SessionListResponse, SessionResponse, SessionUpdate
from src.services import session as session_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=SessionListResponse)
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
) -> SessionListResponse:
    """Get list of tracking sessions with pagination.

    Args:
        current_user: Current authenticated user
        db: Database session
        page: Page number (1-based)
        page_size: Number of items per page

    Returns:
        List of sessions with pagination info
    """
    skip = (page - 1) * page_size
    sessions = await session_service.get_user_sessions(db, current_user.id, skip, page_size)
    total = await session_service.count_user_sessions(db, current_user.id)
    pages = (total + page_size - 1) // page_size if total > 0 else 0

    return SessionListResponse(
        items=[SessionResponse.model_validate(s) for s in sessions],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Get session by ID.

    Args:
        session_id: Session ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Session data

    Raises:
        HTTPException: If session not found or doesn't belong to user
    """
    session = await session_service.get_session_by_id(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )

    return SessionResponse.model_validate(session)


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Create a new tracking session.

    Args:
        session_data: Session creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created session

    Raises:
        HTTPException: If session for this date already exists
    """
    try:
        session = await session_service.create_session(db, current_user.id, session_data)
        return SessionResponse.model_validate(session)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    session_data: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Update a tracking session.

    Args:
        session_id: Session ID
        session_data: Session update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated session

    Raises:
        HTTPException: If session not found or validation fails
    """
    session = await session_service.get_session_by_id(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )

    try:
        updated_session = await session_service.update_session(db, session, session_data)
        return SessionResponse.model_validate(updated_session)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a tracking session.

    Args:
        session_id: Session ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If session not found
    """
    session = await session_service.get_session_by_id(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )

    await session_service.delete_session(db, session)
