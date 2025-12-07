"""User service for CRUD operations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import User
from src.schemas.user import UserCreate, UserUpdate
from src.utils.security import hash_password


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Get user by email.

    Args:
        db: Database session
        email: User email

    Returns:
        User if found, None otherwise
    """
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """Get user by ID.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        User if found, None otherwise
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """Create a new user.

    Args:
        db: Database session
        user_data: User creation data

    Returns:
        Created user

    Raises:
        ValueError: If user with email already exists
    """
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise ValueError(f"User with email {user_data.email} already exists")

    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user: User, user_data: UserUpdate) -> User:
    """Update user data.

    Args:
        db: Database session
        user: User to update
        user_data: User update data

    Returns:
        Updated user
    """
    if user_data.email is not None:
        existing_user = await get_user_by_email(db, user_data.email)
        if existing_user and existing_user.id != user.id:
            raise ValueError(f"User with email {user_data.email} already exists")
        user.email = user_data.email

    if user_data.full_name is not None:
        user.full_name = user_data.full_name

    if user_data.password is not None:
        user.hashed_password = hash_password(user_data.password)

    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user: User) -> None:
    """Delete a user.

    Args:
        db: Database session
        user: User to delete
    """
    await db.delete(user)
    await db.commit()
