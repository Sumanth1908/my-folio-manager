from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings and configuration."""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "mysql+pymysql://finance_user:finance_password@127.0.0.1:3306/finance_db"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "My Folio Manager"
    
    # Security
    SECRET_KEY: str = "your-secret-key-temporary-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # AI / Gemini
    GOOGLE_API_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]  # For development


settings = Settings()
