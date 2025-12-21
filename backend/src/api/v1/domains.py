"""Domain endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user, get_db
from src.db.models import User
from src.schemas.domain import (
    DomainListResponse,
    DomainResponse,
    DomainStatsListResponse,
    DomainUpdate,
)
from src.services import domain as domain_service

router = APIRouter(prefix="/domains", tags=["domains"])


@router.get("", response_model=DomainListResponse)
async def get_domains(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    session_id: str | None = Query(None),
) -> DomainListResponse:
    """Get list of domains with optional filtering and pagination.

    Args:
        current_user: Current authenticated user
        db: Database session
        page: Page number (1-based)
        page_size: Number of items per page
        session_id: Optional session ID to filter by

    Returns:
        List of domains with pagination info
    """
    skip = (page - 1) * page_size
    domains = await domain_service.get_user_domains(db, current_user.id, skip, page_size, session_id)
    total = await domain_service.count_user_domains(db, current_user.id, session_id)
    pages = (total + page_size - 1) // page_size if total > 0 else 0

    return DomainListResponse(
        items=[DomainResponse.model_validate(d) for d in domains],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{domain_id}", response_model=DomainResponse)
async def get_domain(
    domain_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DomainResponse:
    """Get domain by ID.

    Args:
        domain_id: Domain ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Domain data

    Raises:
        HTTPException: If domain not found or doesn't belong to user
    """
    domain = await domain_service.get_domain_by_id(db, domain_id, current_user.id)
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain {domain_id} not found",
        )

    return DomainResponse.model_validate(domain)


@router.put("/{domain_id}", response_model=DomainResponse)
async def update_domain(
    domain_id: str,
    domain_data: DomainUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DomainResponse:
    """Update a domain.

    Args:
        domain_id: Domain ID
        domain_data: Domain update data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated domain

    Raises:
        HTTPException: If domain not found
    """
    domain = await domain_service.get_domain_by_id(db, domain_id, current_user.id)
    if not domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain {domain_id} not found",
        )

    updated_domain = await domain_service.update_domain(db, domain, domain_data)
    return DomainResponse.model_validate(updated_domain)


@router.get("/stats", response_model=DomainStatsListResponse)
async def get_domain_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DomainStatsListResponse:
    """Get aggregated domain statistics.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of domain statistics
    """
    stats = await domain_service.get_domain_stats(db, current_user.id)
    return DomainStatsListResponse(items=stats, total=len(stats))
