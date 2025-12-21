"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from src.api.v1.router import api_router
from src.config import settings

app = FastAPI(
    title="Browser Time Tracking API",
    description="Backend API for Browser Time Tracking Extension",
    version="1.0.0",
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Serve static files (auth page)
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}


@app.get("/auth")
async def auth_redirect():
    """Redirect to auth page."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/static/auth.html")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
