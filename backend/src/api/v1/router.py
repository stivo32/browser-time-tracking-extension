"""Main API router for v1."""

from fastapi import APIRouter

from src.api.v1 import auth, domains, sessions, users
from src.config import settings

api_router = APIRouter(prefix=settings.api_v1_prefix)

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(sessions.router)
api_router.include_router(domains.router)
