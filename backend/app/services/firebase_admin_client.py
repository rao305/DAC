"""Firebase Admin initialization helpers."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Optional, Dict, Tuple

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

from config import get_settings

firebase_app: Optional[firebase_admin.App] = None

# Simple in-memory cache for verified tokens: {token: (decoded_payload, expiry_time)}
_token_cache: Dict[str, Tuple[dict, float]] = {}
_CACHE_TTL = 300  # 5 minutes


def _build_credentials() -> credentials.Certificate:
    """Load Firebase credentials from env configuration."""
    settings = get_settings()

    if settings.firebase_credentials_file:
        cred_path = Path(settings.firebase_credentials_file).expanduser()
        if not cred_path.exists():
            raise RuntimeError(
                f"Firebase credentials file not found at {cred_path}. "
                "Update FIREBASE_CREDENTIALS_FILE to point to your service account JSON."
            )
        return credentials.Certificate(str(cred_path))

    if settings.firebase_credentials_json:
        try:
            payload = json.loads(settings.firebase_credentials_json)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Invalid FIREBASE_CREDENTIALS_JSON payload") from exc
        return credentials.Certificate(payload)

    raise RuntimeError(
        "Firebase credentials not configured. "
        "Set FIREBASE_CREDENTIALS_FILE or FIREBASE_CREDENTIALS_JSON."
    )


def get_firebase_app() -> firebase_admin.App:
    """Initialize (or return existing) Firebase app."""
    global firebase_app
    if firebase_app:
        return firebase_app

    cred = _build_credentials()
    settings = get_settings()
    options = {}
    if settings.firebase_project_id:
        options["projectId"] = settings.firebase_project_id

    firebase_app = firebase_admin.initialize_app(cred, options or None)
    return firebase_app


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded payload.

    Uses in-memory caching to speed up repeated verifications of the same token.
    """
    # Check cache first
    current_time = time.time()
    if id_token in _token_cache:
        cached_payload, expiry = _token_cache[id_token]
        if current_time < expiry:
            return cached_payload
        else:
            # Expired - remove from cache
            del _token_cache[id_token]

    # Not in cache or expired - verify with Firebase
    app = get_firebase_app()
    decoded_payload = firebase_auth.verify_id_token(id_token, app=app)

    # Cache the result
    expiry_time = current_time + _CACHE_TTL
    _token_cache[id_token] = (decoded_payload, expiry_time)

    # Clean up old entries (simple approach: if cache gets too large)
    if len(_token_cache) > 1000:
        # Remove expired entries
        expired_keys = [k for k, (_, exp) in _token_cache.items() if exp < current_time]
        for key in expired_keys:
            del _token_cache[key]

    return decoded_payload
