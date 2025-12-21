"""Domain service for managing time tracking domains."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Domain
from src.schemas.domain import DomainCreate, DomainStats, DomainUpdate
from src.services import session as session_service


async def get_domain_by_id(db: AsyncSession, domain_id: str, user_id: str) -> Domain | None:
    """Get domain by ID for a specific user.

    Args:
        db: Database session
        domain_id: Domain ID
        user_id: User ID (for authorization)

    Returns:
        Domain if found and belongs to user, None otherwise
    """
    result = await db.execute(select(Domain).where(Domain.id == domain_id, Domain.user_id == user_id))
    return result.scalar_one_or_none()


async def get_user_domains(
    db: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
    session_id: str | None = None,
) -> list[Domain]:
    """Get list of domains for a user with optional filtering.

    Args:
        db: Database session
        user_id: User ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        session_id: Optional session ID to filter by

    Returns:
        List of domains
    """
    query = select(Domain).where(Domain.user_id == user_id)

    if session_id:
        query = query.where(Domain.session_id == session_id)

    result = await db.execute(query.order_by(Domain.total_time.desc()).offset(skip).limit(limit))
    return list(result.scalars().all())


async def count_user_domains(db: AsyncSession, user_id: str, session_id: str | None = None) -> int:
    """Count total number of domains for a user.

    Args:
        db: Database session
        user_id: User ID
        session_id: Optional session ID to filter by

    Returns:
        Total number of domains
    """
    query = select(func.count(Domain.id)).where(Domain.user_id == user_id)

    if session_id:
        query = query.where(Domain.session_id == session_id)

    result = await db.execute(query)
    return result.scalar_one() or 0


async def create_domain(db: AsyncSession, user_id: str, domain_data: DomainCreate) -> Domain:
    """Create a new domain.

    Args:
        db: Database session
        user_id: User ID
        domain_data: Domain creation data

    Returns:
        Created domain

    Raises:
        ValueError: If session doesn't exist or doesn't belong to user
    """
    session = await session_service.get_session_by_id(db, domain_data.session_id, user_id)
    if not session:
        raise ValueError(f"Session {domain_data.session_id} not found")

    domain = Domain(
        user_id=user_id,
        session_id=domain_data.session_id,
        domain=domain_data.domain,
        total_time=domain_data.total_time,
        category=domain_data.category,
        custom_name=domain_data.custom_name,
    )

    db.add(domain)
    await db.commit()
    await db.refresh(domain)
    return domain


async def update_domain(db: AsyncSession, domain: Domain, domain_data: DomainUpdate) -> Domain:
    """Update a domain.

    Args:
        db: Database session
        domain: Domain to update
        domain_data: Domain update data

    Returns:
        Updated domain
    """
    if domain_data.domain is not None:
        domain.domain = domain_data.domain

    if domain_data.total_time is not None:
        domain.total_time = domain_data.total_time

    if domain_data.category is not None:
        domain.category = domain_data.category

    if domain_data.custom_name is not None:
        domain.custom_name = domain_data.custom_name

    await db.commit()
    await db.refresh(domain)
    return domain


async def delete_domain(db: AsyncSession, domain: Domain) -> None:
    """Delete a domain.

    Args:
        db: Database session
        domain: Domain to delete
    """
    await db.delete(domain)
    await db.commit()


async def get_domain_stats(db: AsyncSession, user_id: str) -> list[DomainStats]:
    """Get aggregated domain statistics for a user.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        List of domain statistics
    """
    result = await db.execute(
        select(
            Domain.domain,
            func.sum(Domain.total_time).label("total_time"),
            Domain.category,
            Domain.custom_name,
            func.count(Domain.id).label("visit_count"),
        )
        .where(Domain.user_id == user_id)
        .group_by(Domain.domain, Domain.category, Domain.custom_name)
        .order_by(func.sum(Domain.total_time).desc())
    )

    stats = []
    for row in result.all():
        stats.append(
            DomainStats(
                domain=row.domain,
                total_time=row.total_time or 0,
                category=row.category,
                custom_name=row.custom_name,
                visit_count=row.visit_count or 0,
            )
        )

    return stats
