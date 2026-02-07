from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import (create_db_and_tables, seed_categories,
                               seed_currencies)
from app.routers import (accounts, categories, currencies, jobs, rules,
                         transactions, auth, settings as settings_router, summary, holdings, portfolio, assistant, data)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    create_db_and_tables()
    seed_currencies() # Enable seeding on startup
    # seed_categories() # Disable or refactor to be user-aware
    
    yield
    
    # Shutdown (nothing to clean up now that we use Celery)


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(currencies.router)
app.include_router(categories.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(jobs.router)
app.include_router(rules.router)
app.include_router(settings_router.router)
app.include_router(summary.router)
app.include_router(holdings.router)
app.include_router(portfolio.router)
app.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
app.include_router(data.router)
