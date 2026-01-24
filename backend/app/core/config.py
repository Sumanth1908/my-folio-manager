import os


class Settings:
    """Application settings and configuration."""
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://finance_user:finance_password@127.0.0.1:3306/finance_db"
    )
    
    # API
    API_V1_PREFIX: str = ""
    API_V1_STR: str = ""
    PROJECT_NAME: str = "My Folio Manager"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-temporary-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]  # For development


settings = Settings()
