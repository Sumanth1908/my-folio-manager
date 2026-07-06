"""Redis-backed fixed-window rate limiting for sensitive endpoints.

Fails open: if Redis is unreachable the request is allowed, so an outage of
the cache never locks users out of the app.
"""
import logging

import redis
from fastapi import HTTPException, Request

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None


def _get_client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(
            settings.redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1
        )
    return _redis_client


def rate_limit(name: str, limit: int, window_seconds: int):
    """Build a FastAPI dependency limiting each client IP to `limit` requests per window."""

    def dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        key = f"rate:{name}:{client_ip}"
        try:
            client = _get_client()
            current = client.incr(key)
            if current == 1:
                client.expire(key, window_seconds)
            if current > limit:
                raise HTTPException(
                    status_code=429,
                    detail="Too many attempts. Please try again later.",
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Rate limiter unavailable ({e}); allowing request")

    return dependency
