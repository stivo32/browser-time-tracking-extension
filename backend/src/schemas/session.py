"""Session (tracking) schemas."""

import datetime

from pydantic import BaseModel, Field


class SessionBase(BaseModel):
    """Base session schema."""

    date: datetime.date


class SessionCreate(SessionBase):
    """Session creation schema."""

    pass


class SessionUpdate(BaseModel):
    """Session update schema."""

    date: datetime.date | None = None


class SessionResponse(SessionBase):
    """Session response schema."""

    id: str
    user_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    """List of sessions with pagination."""

    items: list[SessionResponse]
    total: int
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)
    pages: int
