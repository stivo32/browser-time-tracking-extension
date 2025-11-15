"""Integration tests for API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import User
from src.main import app
from src.utils.security import hash_password


@pytest.fixture
async def test_client(db_session: AsyncSession):
    """Create test HTTP client."""
    from src.db.database import get_db

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_register_endpoint(test_client: AsyncClient):
    """Test POST /api/v1/auth/register."""
    response = await test_client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "password123",
            "full_name": "New User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert "session" in data
    assert "user" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["session"]["session_token"] is not None


@pytest.mark.asyncio
async def test_login_endpoint(test_client: AsyncClient, test_user: User):
    """Test POST /api/v1/auth/login."""
    response = await test_client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "session" in data
    assert "user" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["session"]["session_token"] is not None


@pytest.mark.asyncio
async def test_login_endpoint_invalid_credentials(test_client: AsyncClient, test_user: User):
    """Test POST /api/v1/auth/login with invalid credentials."""
    response = await test_client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_endpoint(test_client: AsyncClient, test_user: User):
    """Test GET /api/v1/auth/me."""
    from src.services import session_auth

    db_session = test_client.app.dependency_overrides.get("get_db")
    if db_session:
        auth_session = await session_auth.create_auth_session(db_session(), test_user)

        response = await test_client.get(
            "/api/v1/auth/me",
            headers={"X-Session-Token": auth_session.session_token},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_me_endpoint_unauthorized(test_client: AsyncClient):
    """Test GET /api/v1/auth/me without token."""
    response = await test_client.get("/api/v1/auth/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_users_me_endpoint(test_client: AsyncClient, test_user: User):
    """Test GET /api/v1/users/me."""
    from src.services import session_auth

    db = test_client.app.dependency_overrides.get("get_db")
    if db:
        auth_session = await session_auth.create_auth_session(db(), test_user)

        response = await test_client.get(
            "/api/v1/users/me",
            headers={"X-Session-Token": auth_session.session_token},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
