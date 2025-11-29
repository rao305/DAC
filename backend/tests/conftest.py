"""Pytest configuration and fixtures."""
import pytest
import os
from unittest.mock import patch


@pytest.fixture(autouse=True)
def mock_openai_key():
    """Mock OpenAI API key for tests."""
    with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}):
        yield
