from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SECRET_KEY = "your-secret-key-temporary-change-in-production"


class Settings(BaseSettings):
    """Application settings and configuration."""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Environment: development | production
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "mysql+pymysql://finance_user:finance_password@127.0.0.1:3306/finance_db"

    # Redis (falls back to the Celery broker URL so a single env var works in Docker)
    REDIS_URL: str = ""
    CELERY_BROKER_URL: str = "redis://127.0.0.1:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://127.0.0.1:6379/0"

    # API
    API_V1_PREFIX: str = "/api/v1"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "My Folio Manager"

    # Security
    SECRET_KEY: str = DEFAULT_SECRET_KEY
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # AI / Gemini
    GOOGLE_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["*"]  # For development

    @property
    def redis_url(self) -> str:
        return self.REDIS_URL or self.CELERY_BROKER_URL

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


settings = Settings()
