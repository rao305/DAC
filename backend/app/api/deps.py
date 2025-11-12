"""Shared API dependencies."""
from typing import Optional
from fastapi import Header, HTTPException, status


async def require_org_id(x_org_id: Optional[str] = Header(default=None)) -> str:
    """
    Ensure requests include the tenant header.

    Returns:
        The organization ID extracted from the `x-org-id` header.
    """
    if not x_org_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing x-org-id header"
        )
    return x_org_id
