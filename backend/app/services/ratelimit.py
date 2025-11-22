"""Per-org rate limiting helpers (Upstash Redis)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException, status
from upstash_redis.asyncio import Redis
from upstash_redis.errors import UpstashError

from config import get_settings
from app.models.provider_key import ProviderType

settings = get_settings()


def _build_client() -> Optional[Redis]:
    try:
        # Upstash Redis client expects HTTP/HTTPS URL, not redis:// URL
        if not settings.upstash_redis_url.startswith(('http://', 'https://')):
            return None
        return Redis(url=settings.upstash_redis_url, token=settings.upstash_redis_token)
    except Exception:
        return None


redis_client = _build_client()


@dataclass
class RateLimitUsage:
    """Current usage snapshot."""

    requests: int
    tokens: int
    request_limit: int
    token_limit: int


def _key(org_id: str, provider: ProviderType, suffix: str) -> str:
    return f"rl:{org_id}:{provider.value}:{suffix}"


def _seconds_until_midnight() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(1, int((tomorrow - now).total_seconds()))


async def enforce_limits(
    org_id: str,
    provider: ProviderType,
    prompt_tokens: int,
    request_limit: int,
    token_limit: int,
) -> RateLimitUsage:
    """Increment counters before provider invocation and raise if over budget."""
    if redis_client is None:
        # Fallback: skip enforcement but return placeholder usage.
        return RateLimitUsage(0, 0, request_limit, token_limit)

    request_key = _key(org_id, provider, "requests")
    token_key = _key(org_id, provider, "tokens")
    ttl = _seconds_until_midnight()

    try:
        request_count = await redis_client.incr(request_key)
        if request_count == 1:
            await redis_client.expire(request_key, ttl)

        token_count = await redis_client.incrby(token_key, max(0, prompt_tokens))
        if token_count == max(0, prompt_tokens):
            await redis_client.expire(token_key, ttl)

    except UpstashError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Rate limit service unavailable: {exc}",
        ) from exc

    if request_count > request_limit or token_count > token_limit:
        # Roll back increments to avoid poisoning counters
        await redis_client.decr(request_key)
        if prompt_tokens:
            await redis_client.decrby(token_key, prompt_tokens)

        retry_after = ttl
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMIT",
                "provider": provider.value,
                "hint": "Daily budget exceeded. Try again after reset.",
            },
            headers={"Retry-After": str(retry_after)},
        )

    return RateLimitUsage(request_count, token_count, request_limit, token_limit)


async def record_additional_tokens(org_id: str, provider: ProviderType, tokens: int) -> None:
    """Add completion tokens after the provider returns."""
    if redis_client is None or tokens <= 0:
        return
    token_key = _key(org_id, provider, "tokens")
    ttl = _seconds_until_midnight()
    try:
        current = await redis_client.incrby(token_key, tokens)
        if current == tokens:
            await redis_client.expire(token_key, ttl)
    except UpstashError:
        # Non-fatal; log if logging available
        return


async def get_usage(org_id: str, provider: ProviderType, request_limit: int, token_limit: int) -> RateLimitUsage:
    """Fetch current usage counters for UI reporting."""
    if redis_client is None:
        return RateLimitUsage(0, 0, request_limit, token_limit)

    try:
        requests_raw = await redis_client.get(_key(org_id, provider, "requests"))
        tokens_raw = await redis_client.get(_key(org_id, provider, "tokens"))
    except UpstashError:
        return RateLimitUsage(0, 0, request_limit, token_limit)

    requests_val = int(requests_raw) if requests_raw else 0
    tokens_val = int(tokens_raw) if tokens_raw else 0

    return RateLimitUsage(requests_val, tokens_val, request_limit, token_limit)
