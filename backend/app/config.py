"""Application configuration using pydantic-settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    app_name: str = "AI Guardian"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "production"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_guardian"
    database_url_sync: str = "postgresql://postgres:postgres@localhost:5432/ai_guardian"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_STRONG_SECRET_KEY_32CHARS"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # Upstream LLM
    openai_api_base: str = "https://api.openai.com/v1"
    openai_api_key: str = ""

    # Demo mode — mock LLM responses (no real API key needed)
    demo_mode: bool = False

    # Review SLA
    review_sla_minutes: int = 30  # escalate if not reviewed within 30 min
    review_sla_fallback: str = "block"  # block | allow | escalate

    # Risk thresholds
    risk_low_max: int = 30
    risk_medium_max: int = 60
    risk_high_max: int = 80
    # Critical: 81-100

    # Auto-block threshold (skip review, block immediately)
    auto_block_threshold: int = 81  # Critical

    # Auto-allow threshold (skip review, allow immediately)
    auto_allow_threshold: int = 30  # Low


settings = Settings()
