#!/usr/bin/env python3
"""
Quick script to verify Qdrant connection.
Works with both local Docker and Qdrant Cloud.
"""

import asyncio
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / "backend" / ".env")

async def test_qdrant():
    """Test Qdrant connection."""
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_key = os.getenv("QDRANT_API_KEY", "")

    print("=" * 60)
    print("QDRANT CONNECTION TEST")
    print("=" * 60)
    print()
    print(f"URL: {qdrant_url}")
    print(f"API Key: {'***' + qdrant_key[-8:] if qdrant_key else '(empty - local Docker)'}")
    print()

    try:
        from qdrant_client import AsyncQdrantClient

        # Create client
        client = AsyncQdrantClient(
            url=qdrant_url,
            api_key=qdrant_key if qdrant_key else None,
            timeout=10.0
        )

        # Test connection
        print("📡 Connecting...")
        collections = await client.get_collections()

        print("✅ CONNECTION SUCCESSFUL!")
        print()
        print(f"Collections found: {len(collections.collections)}")
        if collections.collections:
            for col in collections.collections:
                print(f"  - {col.name}: {col.points_count} points")
        else:
            print("  (No collections yet - will be created automatically)")

        print()
        print("🎉 Qdrant is ready for memory storage!")
        print()

        # Check if dac_memory collection exists
        collection_names = [c.name for c in collections.collections]
        if "dac_memory" not in collection_names:
            print("ℹ️  Note: 'dac_memory' collection will be created automatically")
            print("   when you first save memory fragments.")

        return True

    except ImportError:
        print("❌ ERROR: qdrant-client not installed")
        print()
        print("Install it with:")
        print("  pip install qdrant-client")
        return False

    except Exception as e:
        print(f"❌ CONNECTION FAILED: {e}")
        print()
        print("Troubleshooting:")
        print()

        if "localhost" in qdrant_url:
            print("🐳 Local Docker Setup:")
            print("  1. Check if Qdrant is running:")
            print("     docker ps | grep qdrant")
            print()
            print("  2. If not running, start it:")
            print("     cd /Users/rao305/Documents/DAC")
            print("     docker-compose up -d qdrant")
            print()
            print("  3. Check logs:")
            print("     docker logs dac-qdrant")
        else:
            print("☁️  Qdrant Cloud Setup:")
            print("  1. Verify your URL format:")
            print("     Should be: https://xxx.aws.cloud.qdrant.io:6333")
            print()
            print("  2. Verify your API key:")
            print("     Copy from: https://cloud.qdrant.io/")
            print()
            print("  3. Update .env file:")
            print("     QDRANT_URL=your-cluster-url")
            print("     QDRANT_API_KEY=your-api-key")

        return False


async def test_openai():
    """Test OpenAI API key (needed for embeddings)."""
    openai_key = os.getenv("OPENAI_API_KEY", "")

    print()
    print("=" * 60)
    print("OPENAI API TEST (for embeddings)")
    print("=" * 60)
    print()

    if not openai_key:
        print("❌ OPENAI_API_KEY not set")
        print()
        print("This is needed for generating embeddings.")
        print("Add it to your .env file:")
        print("  OPENAI_API_KEY=sk-...")
        return False

    print(f"API Key: sk-...{openai_key[-8:]}")
    print()

    try:
        import httpx

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {openai_key}"},
                timeout=10.0
            )

            if response.status_code == 200:
                print("✅ OPENAI API KEY VALID!")
                print()
                return True
            else:
                print(f"❌ API Key Invalid (status {response.status_code})")
                print()
                return False

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


async def main():
    """Run all tests."""
    qdrant_ok = await test_qdrant()
    openai_ok = await test_openai()

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print()

    if qdrant_ok and openai_ok:
        print("🎉 ALL SYSTEMS READY!")
        print()
        print("Your intelligent routing system is ready to use.")
        print("Memory will be stored and retrieved across all models.")
        print()
        print("Next steps:")
        print("  1. Start backend: cd backend && python main.py")
        print("  2. Test system: python test_intelligent_routing.py")
        print()
        return 0
    else:
        print("⚠️  SETUP INCOMPLETE")
        print()
        if not qdrant_ok:
            print("❌ Qdrant: Not connected")
            print("   See QDRANT_SETUP_GUIDE.md for help")
        else:
            print("✅ Qdrant: Connected")

        if not openai_ok:
            print("❌ OpenAI: API key issue")
        else:
            print("✅ OpenAI: API key valid")

        print()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
