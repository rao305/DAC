#!/usr/bin/env python3
"""
Test script to verify current model names for all providers
"""

import asyncio
import httpx
import sys
import os
from config import get_settings

async def test_openai_models():
    """Test OpenAI models"""
    settings = get_settings()
    
    if not settings.openai_api_key:
        print("❌ No OpenAI API key found")
        return
    
    # Test current OpenAI models
    test_models = ["gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo"]
    
    print("\n🔍 Testing OpenAI models...")
    
    for model in test_models:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": "Hello"}],
                        "max_tokens": 10
                    }
                )
                
                if response.status_code == 200:
                    print(f"   ✅ {model}")
                else:
                    print(f"   ❌ {model}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {model}: {e}")

async def test_perplexity_models():
    """Test Perplexity models"""
    settings = get_settings()
    
    if not settings.perplexity_api_key:
        print("❌ No Perplexity API key found")
        return
    
    # Test current Perplexity models
    test_models = [
        "llama-3.1-sonar-small-128k-online",
        "llama-3.1-sonar-large-128k-online", 
        "llama-3.1-sonar-huge-128k-online",
        "sonar-pro",
        "sonar",
        "sonar-small",
        "llama-3.1-70b-instruct",
        "llama-3.1-8b-instruct"
    ]
    
    print("\n🔍 Testing Perplexity models...")
    
    for model in test_models:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={"Authorization": f"Bearer {settings.perplexity_api_key}"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": "Hello"}],
                        "max_tokens": 10
                    }
                )
                
                if response.status_code == 200:
                    print(f"   ✅ {model}")
                else:
                    print(f"   ❌ {model}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {model}: {e}")

async def test_kimi_models():
    """Test Kimi models"""
    settings = get_settings()
    
    if not settings.kimi_api_key:
        print("❌ No Kimi API key found")
        return
    
    # Test current Kimi models
    test_models = [
        "moonshot-v1-8k",
        "moonshot-v1-32k", 
        "moonshot-v1-128k",
        "moonshot-v1"
    ]
    
    print("\n🔍 Testing Kimi models...")
    
    for model in test_models:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    "https://api.moonshot.cn/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.kimi_api_key}"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": "Hello"}],
                        "max_tokens": 10
                    }
                )
                
                if response.status_code == 200:
                    print(f"   ✅ {model}")
                else:
                    print(f"   ❌ {model}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {model}: {e}")

async def main():
    """Main test function"""
    print("🧪 Model Availability Test")
    print("=" * 50)
    
    await test_openai_models()
    await test_perplexity_models()
    await test_kimi_models()
    
    print("\n📋 Recommended models for collaboration:")
    print("   OpenAI: gpt-4o, gpt-4o-mini")
    print("   Perplexity: llama-3.1-sonar-large-128k-online")
    print("   Gemini: gemini-2.5-flash, gemini-2.5-pro") 
    print("   Kimi: moonshot-v1-32k")

if __name__ == "__main__":
    asyncio.run(main())