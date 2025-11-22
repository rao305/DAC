"""Generate thinking/searching preamble for UI display."""
import random
import re
from typing import List


def generate_search_tags(user_query: str, num_tags: int = 5) -> List[str]:
    """
    Generate relevant search tags based on user query.
    
    Args:
        user_query: The user's input query
        num_tags: Number of tags to generate (default 5, will be 4-6)
    
    Returns:
        List of search tag strings
    """
    # Clean and extract key terms
    query_lower = user_query.lower().strip()
    
    # Remove common stop words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where', 'can', 'could', 'should', 'would', 'will'}
    words = [w for w in re.findall(r'\b\w+\b', query_lower) if w not in stop_words and len(w) > 2]
    
    # Generate tags based on query
    tags = []
    
    # Extract key phrases (2-3 word combinations)
    if len(words) >= 2:
        for i in range(len(words) - 1):
            phrase = f"{words[i]} {words[i+1]}"
            if len(phrase) < 40:  # Keep tags reasonable length
                tags.append(phrase)
    
    # Add individual important words
    important_words = words[:3]
    tags.extend(important_words)
    
    # Add contextual tags based on common query patterns
    if any(word in query_lower for word in ['how', 'tutorial', 'guide', 'learn']):
        tags.append('how to guide')
        tags.append('step by step instructions')
    
    if any(word in query_lower for word in ['what', 'define', 'meaning', 'explain']):
        tags.append('definition explanation')
        tags.append('overview')
    
    if any(word in query_lower for word in ['best', 'top', 'recommend', 'compare']):
        tags.append('comparison')
        tags.append('recommendations')
    
    if any(word in query_lower for word in ['error', 'problem', 'issue', 'fix', 'debug']):
        tags.append('troubleshooting')
        tags.append('solutions')
    
    if any(word in query_lower for word in ['code', 'programming', 'function', 'api']):
        tags.append('code examples')
        tags.append('implementation')
    
    # Remove duplicates while preserving order
    seen = set()
    unique_tags = []
    for tag in tags:
        if tag not in seen:
            seen.add(tag)
            unique_tags.append(tag)
    
    # Return 4-6 tags
    num_to_return = min(max(4, num_tags), 6)
    return unique_tags[:num_to_return]


def generate_strategy_statement(user_query: str) -> str:
    """
    Generate a concise strategy statement describing what to search for.
    
    Args:
        user_query: The user's input query
    
    Returns:
        Strategy statement string
    """
    query_lower = user_query.lower().strip()
    
    # Extract main topic (first 10-15 words)
    words = query_lower.split()[:15]
    topic = ' '.join(words)
    
    # Clean up
    if len(topic) > 80:
        topic = topic[:77] + '...'
    
    return f"Searching for resources that discuss {topic}."


def generate_thinking_preamble(user_query: str) -> str:
    """
    Generate the complete thinking/searching preamble for UI display.
    
    Args:
        user_query: The user's input query
    
    Returns:
        Complete preamble string following the required format
    """
    # Generate components
    strategy = generate_strategy_statement(user_query)
    tags = generate_search_tags(user_query)
    num_sources = random.randint(5, 10)
    
    # Build preamble
    preamble = "🤖 Thinking...\n\n"
    preamble += f"{strategy}\n\n"
    preamble += "Searching\n\n"
    
    # Add search tags with Q prefix
    for tag in tags:
        preamble += f"Q {tag}\n"
    
    preamble += f"\nReviewing sources: {num_sources}\n\n"
    
    return preamble

