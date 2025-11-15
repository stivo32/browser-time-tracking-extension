"""Tests for authentication service and endpoints."""


import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import User
from src.schemas.auth import LoginRequest, RegisterRequest
from src.services import auth as auth_service
from src.utils.security import hash_password, verify_password


@pytest.mark.asyncio
async def test_register_user(db_session: AsyncSession):
    """Test user registration."""
    register_data = RegisterRequest(
        email="test@example.com",
        password="password123",
        full_name="Test User",
    )

    user, session_token = await auth_service.register_user(db_session, register_data)

    assert user.email == "test@example.com"
    assert user.full_name == "Test User"
    assert user.hashed_password != "password123"
    assert verify_password("password123", user.hashed_password)
    assert session_token is not None


@pytest.mark.asyncio
async def test_register_user_duplicate_email(db_session: AsyncSession):
    """Test registration with duplicate email."""
    register_data = RegisterRequest(
        email="test@example.com",
        password="password123",
    )

    await auth_service.register_user(db_session, register_data)

    with pytest.raises(ValueError, match="already exists"):
        await auth_service.register_user(db_session, register_data)


@pytest.mark.asyncio
async def test_login_user(db_session: AsyncSession):
    """Test user login."""
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    login_data = LoginRequest(email="test@example.com", password="password123")
    user_result, session_token = await auth_service.login_user(db_session, login_data)

    assert user_result.id == user.id
    assert session_token is not None


@pytest.mark.asyncio
async def test_login_user_invalid_password(db_session: AsyncSession):
    """Test login with invalid password."""
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    login_data = LoginRequest(email="test@example.com", password="wrongpassword")

    with pytest.raises(ValueError, match="Invalid email or password"):
        await auth_service.login_user(db_session, login_data)


@pytest.mark.asyncio
async def test_login_user_inactive(db_session: AsyncSession):
    """Test login with inactive user."""
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        is_active=False,
    )
    db_session.add(user)
    await db_session.commit()

    login_data = LoginRequest(email="test@example.com", password="password123")

    with pytest.raises(ValueError, match="inactive"):
        await auth_service.login_user(db_session, login_data)


@pytest.mark.asyncio
async def test_get_current_user(db_session: AsyncSession):
    """Test getting current user by session token."""
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    from src.services import session_auth

    auth_session = await session_auth.create_auth_session(db_session, user)
    current_user = await auth_service.get_current_user(db_session, auth_session.session_token)

    assert current_user is not None
    assert current_user.id == user.id


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(db_session: AsyncSession):
    """Test getting current user with invalid token."""
    current_user = await auth_service.get_current_user(db_session, "invalid_token")
    assert current_user is None
