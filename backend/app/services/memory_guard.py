"""Qdrant health guard."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx

from config import get_settings

settings = get_settings()
MEMORY_DISABLED = False


@dataclass
class MemoryStatus:
    """Runtime memory subsystem status."""

    enabled: bool
    message: str
    last_checked: Optional[datetime]


class MemoryGuard:
    """Tracks Qdrant readiness and exposes a simple flag."""

    def __init__(self):
        self._disabled = False
        self._message = "Not checked"
        self._last_checked: Optional[datetime] = None
        self._lock = asyncio.Lock()

    @property
    def disabled(self) -> bool:
        return self._disabled

    async def ensure_health(self, *, force: bool = False) -> None:
        """Check Qdrant readiness (cached for 60s)."""
        if not force and self._last_checked and datetime.now(timezone.utc) - self._last_checked < timedelta(seconds=60):
            return

        async with self._lock:
            if not force and self._last_checked and datetime.now(timezone.utc) - self._last_checked < timedelta(seconds=60):
                return
            await self._check_once()

    async def _check_once(self) -> None:
        url = settings.qdrant_url.rstrip("/") + "/readyz"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url, headers={"api-key": settings.qdrant_api_key})
            if response.status_code == 200:
                self._set_disabled(False, "healthy")
            else:
                self._set_disabled(True, f"readyz status {response.status_code}")
        except Exception as exc:
            self._set_disabled(True, f"{type(exc).__name__}: {exc}")
        finally:
            self._last_checked = datetime.now(timezone.utc)

    def status(self) -> MemoryStatus:
        """Return latest status snapshot."""
        return MemoryStatus(
            enabled=not self._disabled,
            message=self._message,
            last_checked=self._last_checked,
        )

    def _set_disabled(self, disabled: bool, message: str) -> None:
        """Helper to update flag + message in one place."""
        global MEMORY_DISABLED
        self._disabled = disabled
        self._message = message
        MEMORY_DISABLED = disabled


memory_guard = MemoryGuard()
