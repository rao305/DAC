"""Seed script for production organization and data.

Usage:
    python seed_production.py
"""
import asyncio
import sys
from datetime import datetime

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.org import Org
from app.models.user import User, UserRole
from app.models.provider_key import ProviderKey, ProviderType
from app.security import encryption_service
from config import get_settings


async def seed_production_data():
    """Create production organization for real users."""

    settings = get_settings()

    async with AsyncSessionLocal() as session:
        try:
            # Check if production org already exists
            stmt = select(Org).where(Org.id == "org_syntra")
            result = await session.execute(stmt)
            existing_org = result.scalar_one_or_none()

            if existing_org:
                print(f"✓ Production org already exists: {existing_org.id}")
                org_id = existing_org.id
            else:
                # Create production organization
                syntra_org = Org(
                    id="org_syntra",
                    name="Syntra Production",
                    slug="syntra",
                    subscription_status="active",
                    seats_licensed=100,
                    seats_used=0
                )
                session.add(syntra_org)
                await session.flush()
                org_id = syntra_org.id
                print(f"✓ Created production org: {org_id}")

            # Seed provider keys from environment variables
            providers_added = []
            provider_configs = [
                (ProviderType.OPENROUTER, settings.openrouter_api_key, "OpenRouter Production"),
                (ProviderType.OPENAI, settings.openai_api_key, "OpenAI Production"),
                (ProviderType.PERPLEXITY, settings.perplexity_api_key, "Perplexity Production"),
                (ProviderType.GEMINI, settings.google_api_key, "Gemini Production"),
                (ProviderType.KIMI, settings.kimi_api_key, "Kimi Production"),
            ]

            for provider_type, api_key, key_name in provider_configs:
                if api_key:  # Only add if API key exists in env
                    # Check if key already exists
                    stmt = select(ProviderKey).where(
                        ProviderKey.org_id == org_id,
                        ProviderKey.provider == provider_type
                    )
                    result = await session.execute(stmt)
                    existing_key = result.scalar_one_or_none()

                    if not existing_key:
                        encrypted_key = encryption_service.encrypt(api_key)
                        provider_key = ProviderKey(
                            org_id=org_id,
                            provider=provider_type,
                            encrypted_key=encrypted_key,
                            key_name=key_name,
                            is_active="true"
                        )
                        session.add(provider_key)
                        providers_added.append(provider_type.value)
                        print(f"✓ Added {provider_type.value} API key")
                    else:
                        print(f"✓ {provider_type.value} key already exists")

            # Commit all changes
            await session.commit()

            print("\n" + "="*60)
            print("PRODUCTION ORGANIZATION CREATED SUCCESSFULLY")
            print("="*60)
            print(f"Organization ID: {org_id}")
            if providers_added:
                print(f"Providers configured: {', '.join(providers_added)}")
            else:
                print("⚠ No provider API keys found in environment variables")
            print("="*60)
            print("\nProduction organization is ready!")
            print("Users can now sign in with Firebase authentication.")
            print("="*60)

            return {
                "org_id": org_id,
                "providers_added": providers_added
            }

        except Exception as e:
            print(f"✗ Error seeding production data: {str(e)}", file=sys.stderr)
            await session.rollback()
            raise


if __name__ == "__main__":
    print("Setting up production organization...")
    result = asyncio.run(seed_production_data())
    print("\nProduction setup complete!")