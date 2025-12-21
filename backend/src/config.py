"""Configuration settings for the application."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "sqlite+aiosqlite:///./app.db"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    session_expire_days: int = 30
    password_min_length: int = 8

    # API
    api_v1_prefix: str = "/api/v1"

    # Environment
    environment: str = "development"
    debug: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
