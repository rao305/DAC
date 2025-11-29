#!/usr/bin/env python3
"""
Test Kimi (Moonshot AI) connection and available models
"""

import asyncio
import sys
import os
from config import get_settings
from app.adapters.kimi import call_kimi

async def test_kimi_connection():
    """Test Kimi API connection and models"""
    settings = get_settings()
    
    if not settings.kimi_api_key:
        print("❌ No Kimi API key found in settings")
        return False
    
    print("🧪 Testing Kimi (Moonshot AI) Connection")
    print("=" * 50)
    print(f"🔑 API Key: {settings.kimi_api_key[:10]}...")
    
    # Test available Kimi models
    test_models = [
        "moonshot-v1-8k",
        "moonshot-v1-32k", 
        "moonshot-v1-128k"
    ]
    
    successful_models = []
    
    for model in test_models:
        try:
            print(f"\n🔍 Testing {model}...")
            
            response = await call_kimi(
                messages=[{"role": "user", "content": "Hello, respond with just 'Hello from Kimi'"}],
                model=model,
                api_key=settings.kimi_api_key,
                max_tokens=20
            )
            
            print(f"✅ {model}: {response.content}")
            successful_models.append(model)
            
        except Exception as e:
            print(f"❌ {model} failed: {e}")
    
    if successful_models:
        print(f"\n🎉 Kimi connection successful!")
        print(f"📊 Working models: {successful_models}")
        return True
    else:
        print(f"\n❌ All Kimi models failed")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_kimi_connection())
    print(f"\nResult: {'✅ Success' if success else '❌ Failed'}")