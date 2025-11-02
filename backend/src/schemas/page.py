"""Page schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class PageBase(BaseModel):
    """Base page schema."""

    url: str = Field(..., max_length=2000)
    title: str | None = Field(None, max_length=500)


class PageCreate(PageBase):
    """Page creation schema."""

    domain_id: str
    time: int = Field(0, ge=0, description="Time in seconds")


class PageUpdate(BaseModel):
    """Page update schema."""

    url: str | None = Field(None, max_length=2000)
    title: str | None = Field(None, max_length=500)
    time: int | None = Field(None, ge=0)


class PageResponse(PageBase):
    """Page response schema."""

    id: str
    domain_id: str
    time: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
