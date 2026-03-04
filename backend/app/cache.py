"""
Application cache for frequently accessed data.
"""

_cache: dict = {}


def get_cache() -> dict:
    """Get the cache dictionary."""
    return _cache


def set_cache(key: str, value):
    """Set a cache value."""
    _cache[key] = value


def clear_cache():
    """Clear all cache."""
    _cache.clear()
