"""Authentication endpoints for Firebase-backed sign-in."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.org import Org
from app.models.user import User, UserRole
from app.services.firebase_admin_client import verify_firebase_token
from app.services.token_service import create_access_token
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


class FirebaseAuthRequest(BaseModel):
    """Payload from the client containing the Firebase ID token."""

    id_token: str = Field(..., min_length=10)


class AuthenticatedUser(BaseModel):
    """Serialized user payload returned to the client."""

    id: str
    email: str
    name: Optional[str] = None


class FirebaseAuthResponse(BaseModel):
    """Response envelope including the app-specific session token."""

    access_token: str
    token_type: str = "bearer"
    org_id: str
    user: AuthenticatedUser


async def _get_default_org(db: AsyncSession) -> Org:
    """Resolve the default org used for Firebase sign-ins."""
    if not settings.default_org_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="DEFAULT_ORG_ID is not configured",
        )

    stmt = select(Org).where(Org.id == settings.default_org_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()
    if org:
        return org

    # Fallback to slug lookup (handy if env stores slug instead of id)
    stmt = select(Org).where(Org.slug == settings.default_org_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()
    if org:
        return org

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Default org not found. Seed the database or update DEFAULT_ORG_ID.",
    )


@router.post("/firebase", response_model=FirebaseAuthResponse)
async def exchange_firebase_token(
    payload: FirebaseAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify a Firebase ID token and mint a DAC session token."""
    try:
        decoded = verify_firebase_token(payload.id_token)
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase token: {exc}",
        ) from exc

    email = decoded.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase user is missing an email address",
        )

    org = await _get_default_org(db)

    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            name=decoded.get("name"),
            org_id=org.id,
            role=UserRole.member,
            email_verified=datetime.utcnow() if decoded.get("email_verified") else None,
        )
        db.add(user)
        await db.flush()
    else:
        # Keep profile metadata fresh
        user.name = decoded.get("name") or user.name

    user.last_login = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(
        subject=user.id,
        org_id=user.org_id,
        email=user.email,
        extra_claims={"firebase_uid": decoded.get("uid")},
    )

    return FirebaseAuthResponse(
        access_token=access_token,
        org_id=user.org_id,
        user=AuthenticatedUser(id=user.id, email=user.email, name=user.name),
    )
