"""Simple topic extraction from conversation history."""
import re
from typing import List, Dict, Any
from datetime import datetime


def extract_topics_from_messages(messages: List[Dict[str, str]], max_topics: int = 10) -> List[Dict[str, Any]]:
    """
    Extract named entities (topics) from conversation messages.
    
    Simple regex-based extraction for:
    - Universities (e.g., "Purdue University", "MIT")
    - Companies (e.g., "OpenAI", "Anthropic")
    - Products (e.g., "DAC", "ChatGPT")
    
    Args:
        messages: List of message dicts with "role" and "content"
        max_topics: Maximum number of topics to return
    
    Returns:
        List of topic dicts: [{"name": "...", "type": "...", "lastSeen": "..."}]
    """
    topics = {}
    current_time = datetime.now().isoformat()
    
    # Combine all message content
    all_text = " ".join([msg.get("content", "") for msg in messages])
    
    # University patterns
    university_patterns = [
        r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:University|College|Institute|School)))\b',
        r'\b(MIT|Caltech|Stanford|Harvard|Yale|Princeton|Columbia|UCLA|UC Berkeley)\b',
        # University abbreviations and nicknames
        r'\b(UMich|U-M|UM|CMU|UIUC|UCB|USC|UNC|Penn|Cornell|Brown|Dartmouth)\b'
    ]

    # Map abbreviations to full names
    abbrev_map = {
        "UMich": "University of Michigan",
        "U-M": "University of Michigan",
        "UM": "University of Michigan",
        "CMU": "Carnegie Mellon University",
        "UIUC": "University of Illinois Urbana-Champaign",
        "UCB": "UC Berkeley",
        "USC": "University of Southern California",
        "UNC": "University of North Carolina",
        "Penn": "University of Pennsylvania",
    }
    
    for pattern in university_patterns:
        matches = re.findall(pattern, all_text)
        for match in matches:
            name = match.strip() if isinstance(match, str) else " ".join(match).strip()
            # Expand abbreviations to full names
            full_name = abbrev_map.get(name, name)
            if len(full_name) > 2 and len(full_name) < 100:  # Reasonable length
                # Store both abbreviation and full name
                topics[full_name] = {
                    "name": full_name,
                    "type": "university",
                    "lastSeen": current_time
                }
                # If it's an abbreviation, also store it for matching
                if name != full_name:
                    topics[name] = {
                        "name": full_name,  # Still map to full name
                        "type": "university",
                        "lastSeen": current_time
                    }
    
    # Company patterns
    company_patterns = [
        r'\b(OpenAI|Anthropic|Google|Microsoft|Meta|Apple|Amazon|Tesla)\b',
        r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:Inc|LLC|Corp|Corporation|Ltd|Company)))\b'
    ]
    
    for pattern in company_patterns:
        matches = re.findall(pattern, all_text)
        for match in matches:
            name = match.strip() if isinstance(match, str) else " ".join(match).strip()
            if len(name) > 2 and len(name) < 50:
                topics[name] = {
                    "name": name,
                    "type": "company",
                    "lastSeen": current_time
                }
    
    # Product/platform patterns
    product_patterns = [
        r'\b(DAC|ChatGPT|GPT-4|Claude|Gemini|Perplexity|Kimi)\b',
        r'\b([A-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)*)\b'  # Acronyms and short names
    ]
    
    for pattern in product_patterns:
        matches = re.findall(pattern, all_text)
        for match in matches:
            name = match.strip() if isinstance(match, str) else " ".join(match).strip()
            # Filter out common words that match the pattern
            if name not in ["THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "OUT", "DAY", "GET", "HAS", "HIM", "HIS", "HOW", "ITS", "MAY", "NEW", "NOW", "OLD", "SEE", "TWO", "WHO", "BOY", "DID", "ITS", "LET", "PUT", "SAY", "SHE", "TOO", "USE"]:
                if len(name) > 1 and len(name) < 50:
                    # Check if it's mentioned multiple times (stronger signal)
                    count = all_text.lower().count(name.lower())
                    if count >= 1:  # At least mentioned once
                        topics[name] = {
                            "name": name,
                            "type": "product",
                            "lastSeen": current_time
                        }
    
    # Return most recent topics (limit to max_topics)
    topic_list = list(topics.values())
    
    # Sort by lastSeen (most recent first) and limit
    topic_list.sort(key=lambda x: x["lastSeen"], reverse=True)
    
    return topic_list[:max_topics]


def extract_topics_from_thread(messages: List[Dict[str, str]], recent_only: bool = True) -> List[Dict[str, Any]]:
    """
    Extract topics from thread messages, optionally only from recent messages.
    
    Args:
        messages: List of message dicts
        recent_only: If True, only extract from last 10 messages
    
    Returns:
        List of topic dicts
    """
    if recent_only:
        # Only use last 10 messages for topic extraction
        messages = messages[-10:]
    
    return extract_topics_from_messages(messages)

