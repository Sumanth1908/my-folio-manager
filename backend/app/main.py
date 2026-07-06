from contextlib import asynccontextmanager

import redis
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings, DEFAULT_SECRET_KEY
from app.core.database import (engine, init_db, seed_currencies)
from app.core.middleware import RequestIDMiddleware
from app.core.exceptions import (global_exception_handler, validation_exception_handler, sqlalchemy_exception_handler)
from app.routers import (accounts, budgets, categories, currencies, jobs, rules,
                         transactions, auth, settings as settings_router, summary, holdings, portfolio, assistant, data)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    if settings.is_production and settings.SECRET_KEY == DEFAULT_SECRET_KEY:
        raise RuntimeError(
            "Refusing to start: SECRET_KEY is still the built-in default. "
            "Set SECRET_KEY in the environment or .env before running in production."
        )
    init_db()
    seed_currencies() # Enable seeding on startup

    yield

    # Shutdown


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Exception handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)

# Configure CORS and Middlewares
app.add_middleware(RequestIDMiddleware)
# Credentials cannot be combined with a wildcard origin (browsers reject it);
# auth uses Bearer headers, not cookies, so credentials are only enabled for
# explicitly listed origins.
_wildcard_cors = settings.CORS_ORIGINS == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=not _wildcard_cors,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Liveness/readiness probe: verifies DB and Redis connectivity."""
    checks = {"database": "ok", "redis": "ok"}
    healthy = True

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        checks["database"] = f"error: {e.__class__.__name__}"
        healthy = False

    try:
        client = redis.Redis.from_url(settings.redis_url, socket_connect_timeout=1, socket_timeout=1)
        client.ping()
    except Exception as e:
        checks["redis"] = f"error: {e.__class__.__name__}"
        healthy = False

    status_code = 200 if healthy else 503
    return JSONResponse(status_code=status_code, content={"status": "ok" if healthy else "degraded", "checks": checks})


# Create API router
api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(currencies.router)
api_router.include_router(categories.router)
api_router.include_router(accounts.router)
api_router.include_router(transactions.router)
api_router.include_router(jobs.router)
api_router.include_router(rules.router)
api_router.include_router(settings_router.router)
api_router.include_router(summary.router)
api_router.include_router(holdings.router)
api_router.include_router(portfolio.router)
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
api_router.include_router(data.router)
api_router.include_router(budgets.router)

# Include API router into main app
app.include_router(api_router, prefix=settings.API_V1_STR)
