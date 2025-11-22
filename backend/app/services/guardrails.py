"""Guardrails: Content filtering, PII detection, prompt injection protection."""
import re
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class SafetyFlags:
    """Safety flags for a request."""
    has_pii: bool = False
    pii_types: list = None
    prompt_injection_risk: bool = False
    content_filter_flagged: bool = False
    refusal_reason: Optional[str] = None
    
    def __post_init__(self):
        if self.pii_types is None:
            self.pii_types = []


# PII patterns (basic detection)
PII_PATTERNS = {
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
    "credit_card": r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b',
    "ip_address": r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
}


# Prompt injection patterns
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(previous|all|above)\s+instructions?",
    r"forget\s+(everything|all|previous)",
    r"system\s*:\s*",
    r"assistant\s*:\s*",
    r"you\s+are\s+now",
    r"new\s+instructions?",
    r"override",
    r"bypass",
    r"jailbreak",
]


def detect_pii(text: str) -> Tuple[bool, list]:
    """
    Detect PII in text.
    
    Returns:
        Tuple of (has_pii, pii_types)
    """
    detected_types = []
    for pii_type, pattern in PII_PATTERNS.items():
        if re.search(pattern, text, re.IGNORECASE):
            detected_types.append(pii_type)
    
    return len(detected_types) > 0, detected_types


def mask_pii(text: str, pii_types: list) -> str:
    """
    Mask PII in text for logging.
    
    Args:
        text: Original text
        pii_types: List of PII types to mask
    
    Returns:
        Text with PII masked
    """
    masked = text
    for pii_type in pii_types:
        if pii_type == "email":
            masked = re.sub(PII_PATTERNS["email"], "[EMAIL_REDACTED]", masked, flags=re.IGNORECASE)
        elif pii_type == "phone":
            masked = re.sub(PII_PATTERNS["phone"], "[PHONE_REDACTED]", masked, flags=re.IGNORECASE)
        elif pii_type == "ssn":
            masked = re.sub(PII_PATTERNS["ssn"], "[SSN_REDACTED]", masked, flags=re.IGNORECASE)
        elif pii_type == "credit_card":
            masked = re.sub(PII_PATTERNS["credit_card"], "[CARD_REDACTED]", masked, flags=re.IGNORECASE)
        elif pii_type == "ip_address":
            masked = re.sub(PII_PATTERNS["ip_address"], "[IP_REDACTED]", masked, flags=re.IGNORECASE)
    
    return masked


def detect_prompt_injection(text: str) -> bool:
    """
    Detect potential prompt injection attempts.
    
    Returns:
        True if prompt injection risk detected
    """
    text_lower = text.lower()
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text_lower):
            return True
    return False


def sanitize_user_input(text: str) -> Tuple[str, SafetyFlags]:
    """
    Sanitize user input and detect safety issues.
    
    Args:
        text: User input text
    
    Returns:
        Tuple of (sanitized_text, safety_flags)
    """
    flags = SafetyFlags()
    
    # Detect PII
    has_pii, pii_types = detect_pii(text)
    flags.has_pii = has_pii
    flags.pii_types = pii_types
    
    # Detect prompt injection
    flags.prompt_injection_risk = detect_prompt_injection(text)
    
    # Sanitize: Remove prompt injection attempts
    sanitized = text
    if flags.prompt_injection_risk:
        # Remove suspicious patterns
        for pattern in PROMPT_INJECTION_PATTERNS:
            sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)
        sanitized = sanitized.strip()
    
    return sanitized, flags


def should_refuse(safety_flags: SafetyFlags) -> Tuple[bool, Optional[str]]:
    """
    Determine if request should be refused.
    
    Returns:
        Tuple of (should_refuse, refusal_reason)
    """
    if safety_flags.prompt_injection_risk:
        return True, "I can't process requests that try to override my instructions. How can I help you in a different way?"
    
    # Add more refusal conditions as needed
    return False, None


def generate_safety_refusal(reason: str) -> str:
    """
    Generate a safe refusal response.
    
    Args:
        reason: Refusal reason
    
    Returns:
        Safe refusal message
    """
    return f"I can't help with that request. {reason} Is there something else I can assist you with?"

