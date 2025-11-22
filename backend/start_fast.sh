#!/bin/bash
# Fast startup script - extracts API keys from DB and sets as env vars

cd /Users/rrao/Desktop/Syntra-main/backend
# Use explicit python from venv
PYTHON_BIN="/Users/rrao/Desktop/Syntra-main/backend/venv/bin/python"

echo "🔑 Extracting API keys from database..."

# Extract API keys using Python
"$PYTHON_BIN" <<'PYTHON_SCRIPT'
import asyncio
import sys
sys.path.insert(0, '/Users/rrao/Desktop/Syntra-main/backend')

from app.database import get_db
from app.models.provider_key import ProviderType
from app.api.providers import get_api_key_for_org
from sqlalchemy.ext.asyncio import AsyncSession

async def get_keys():
    async for db in get_db():
        try:
            org_id = "org_demo"
            keys = {}
            
            for provider in [ProviderType.PERPLEXITY, ProviderType.OPENAI, ProviderType.GEMINI, ProviderType.KIMI]:
                try:
                    key = await get_api_key_for_org(db, org_id, provider)
                    if key:
                        keys[provider.value.upper()] = key
                except:
                    pass
            
            # Print export statements
            for provider, key in keys.items():
                print(f'export {provider}_API_KEY="{key}"')
            
            break
        except Exception as e:
            print(f"# Error: {e}", file=sys.stderr)
            break

asyncio.run(get_keys())
PYTHON_SCRIPT

# Save exports to temp file
"$PYTHON_BIN" << 'PYTHON_SCRIPT' > /tmp/dac_api_keys.sh
import asyncio
import sys
sys.path.insert(0, '/Users/rrao/Desktop/Syntra-main/backend')

from app.database import get_db
from app.models.provider_key import ProviderType
from app.api.providers import get_api_key_for_org

async def get_keys():
    async for db in get_db():
        try:
            org_id = "org_demo"
            keys = {}
            
            for provider in [ProviderType.PERPLEXITY, ProviderType.OPENAI, ProviderType.GEMINI, ProviderType.KIMI]:
                try:
                    key = await get_api_key_for_org(db, org_id, provider)
                    if key:
                        keys[provider.value.upper()] = key
                except:
                    pass
            
            for provider, key in keys.items():
                print(f'export {provider}_API_KEY="{key}"')
            
            break
        except Exception as e:
            break

asyncio.run(get_keys())
PYTHON_SCRIPT

# Source the keys
if [ -f /tmp/dac_api_keys.sh ]; then
    echo "✅ Loading API keys..."
    source /tmp/dac_api_keys.sh
    rm /tmp/dac_api_keys.sh
fi

echo ""
echo "🚀 Starting backend with environment API keys..."
echo "   This will be MUCH faster (no DB lookups)"
echo ""

# Start backend
"$PYTHON_BIN" main.py

