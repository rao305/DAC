"""Utility helpers for issuing and verifying JWT access tokens."""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt

from config import get_settings

settings = get_settings()


class TokenVerificationError(Exception):
    """Raised when an access token cannot be verified."""


def create_access_token(
    subject: str,
    org_id: str,
    email: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Create a signed JWT for the authenticated user."""
    to_encode: Dict[str, Any] = {
        "sub": subject,
        "org_id": org_id,
        "email": email,
    }
    if extra_claims:
        to_encode.update(extra_claims)

    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode["exp"] = expire

    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a previously issued JWT."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise TokenVerificationError("Invalid or expired token") from exc

    if not payload.get("sub") or not payload.get("org_id"):
        raise TokenVerificationError("Token missing required claims")

    return payload
