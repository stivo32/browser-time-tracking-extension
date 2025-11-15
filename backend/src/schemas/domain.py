"""Domain schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class DomainBase(BaseModel):
    """Base domain schema."""

    domain: str = Field(..., max_length=255)
    category: str | None = Field(None, max_length=100)
    custom_name: str | None = Field(None, max_length=255)


class DomainCreate(DomainBase):
    """Domain creation schema."""

    session_id: str
    total_time: int = Field(0, ge=0, description="Total time in seconds")


class DomainUpdate(BaseModel):
    """Domain update schema."""

    domain: str | None = Field(None, max_length=255)
    total_time: int | None = Field(None, ge=0)
    category: str | None = Field(None, max_length=100)
    custom_name: str | None = Field(None, max_length=255)


class DomainResponse(DomainBase):
    """Domain response schema."""

    id: str
    user_id: str
    session_id: str
    total_time: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DomainStats(BaseModel):
    """Domain statistics schema."""

    domain: str
    total_time: int
    category: str | None
    custom_name: str | None
    visit_count: int


class DomainListResponse(BaseModel):
    """List of domains with pagination."""

    items: list[DomainResponse]
    total: int
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)
    pages: int


class DomainStatsListResponse(BaseModel):
    """List of domain statistics."""

    items: list[DomainStats]
    total: int

