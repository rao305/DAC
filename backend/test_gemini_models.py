#!/usr/bin/env python3
"""
Test script to list available Gemini models and fix the configuration
"""

import asyncio
import httpx
import sys
import os
from config import get_settings

async def list_gemini_models():
    """List available Gemini models"""
    settings = get_settings()
    
    if not settings.google_api_key:
        print("❌ No Google API key found in settings")
        return
    
    api_key = settings.google_api_key
    
    # List models endpoint
    url = "https://generativelanguage.googleapis.com/v1beta/models"
    params = {"key": api_key}
    
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                
                print(f"✅ Found {len(models)} available models:")
                for model in models:
                    model_name = model.get("name", "")
                    display_name = model.get("displayName", "")
                    supported_methods = model.get("supportedGenerationMethods", [])
                    
                    if "generateContent" in supported_methods:
                        print(f"   {model_name} - {display_name}")
                
                # Test the corrected model name
                print(f"\n🔧 Testing corrected model names...")
                
                # Try common working model names
                test_models = [
                    "gemini-1.5-flash-latest",
                    "gemini-1.5-pro-latest", 
                    "gemini-pro",
                    "gemini-1.5-flash",
                    "gemini-1.5-pro"
                ]
                
                for test_model in test_models:
                    if any(model["name"].endswith(test_model) or test_model in model["name"] for model in models):
                        full_model_name = next((m["name"] for m in models if test_model in m["name"]), test_model)
                        print(f"   ✅ {test_model} -> {full_model_name}")
                        
                        # Test this model
                        await test_model_call(api_key, full_model_name.replace("models/", ""))
            
            else:
                print(f"❌ Error listing models: {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"❌ Exception listing models: {e}")

async def test_model_call(api_key: str, model: str):
    """Test a specific model call"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    params = {"key": api_key}
    
    payload = {
        "contents": [{
            "role": "user", 
            "parts": [{"text": "Hello, respond with just 'Hello from Gemini'"}]
        }],
        "generationConfig": {
            "maxOutputTokens": 100,
            "temperature": 0.1
        }
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.post(url, params=params, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "")
                        print(f"   ✅ {model}: {text}")
                        return True
            else:
                print(f"   ❌ {model} failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ {model} exception: {e}")
            return False

if __name__ == "__main__":
    asyncio.run(list_gemini_models())