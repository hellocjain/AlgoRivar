"""Redis client adapter with graceful in-memory fallback.

Provides distributed caching and pub/sub capabilities when REDIS_URL is configured,
or seamless thread-safe in-memory caching when running in local/standalone mode.
"""

import json
import logging
import os
import threading
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)

_REDIS_CLIENT = None
_REDIS_INITIALIZED = False
_INIT_LOCK = threading.Lock()

# Thread-safe in-memory fallback cache
_LOCAL_STORE = {}
_LOCAL_EXPIRATIONS = {}
_LOCAL_LOCK = threading.Lock()


def get_redis_client():
    """Retrieve active Redis client instance, or None if Redis is not configured/available."""
    global _REDIS_CLIENT, _REDIS_INITIALIZED

    if _REDIS_INITIALIZED:
        return _REDIS_CLIENT

    with _INIT_LOCK:
        if _REDIS_INITIALIZED:
            return _REDIS_CLIENT

        redis_url = os.getenv("REDIS_URL")
        if not redis_url and os.getenv("REDIS_HOST"):
            host = os.getenv("REDIS_HOST", "localhost")
            port = os.getenv("REDIS_PORT", "6379")
            pwd = os.getenv("REDIS_PASSWORD", "")
            redis_url = f"redis://:{pwd}@{host}:{port}/0" if pwd else f"redis://{host}:{port}/0"

        if redis_url:
            try:
                import redis
                client = redis.from_url(redis_url, socket_timeout=3.0, decode_responses=True)
                client.ping()
                _REDIS_CLIENT = client
                logger.info("Connected to Redis distributed cache and pub/sub broker.")
            except Exception as e:
                logger.warning(f"Redis connection failed ({e}). Falling back to local in-memory store.")
                _REDIS_CLIENT = None
        else:
            _REDIS_CLIENT = None

        _REDIS_INITIALIZED = True
        return _REDIS_CLIENT


def cache_set(key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
    """Store value in Redis or in-memory fallback store."""
    client = get_redis_client()
    val_str = json.dumps(value) if not isinstance(value, str) else value

    if client:
        try:
            if ttl_seconds:
                client.setex(key, ttl_seconds, val_str)
            else:
                client.set(key, val_str)
            return True
        except Exception as e:
            logger.error(f"Redis set failed for key '{key}': {e}")

    # In-memory fallback
    with _LOCAL_LOCK:
        _LOCAL_STORE[key] = val_str
        if ttl_seconds:
            _LOCAL_EXPIRATIONS[key] = time.time() + ttl_seconds
        elif key in _LOCAL_EXPIRATIONS:
            del _LOCAL_EXPIRATIONS[key]
    return True


def cache_get(key: str) -> Optional[Any]:
    """Retrieve value from Redis or in-memory fallback store."""
    client = get_redis_client()
    if client:
        try:
            val = client.get(key)
            if val is not None:
                try:
                    return json.loads(val)
                except Exception:
                    return val
        except Exception as e:
            logger.error(f"Redis get failed for key '{key}': {e}")

    # In-memory fallback
    with _LOCAL_LOCK:
        if key in _LOCAL_STORE:
            exp = _LOCAL_EXPIRATIONS.get(key)
            if exp and time.time() > exp:
                del _LOCAL_STORE[key]
                del _LOCAL_EXPIRATIONS[key]
                return None
            val = _LOCAL_STORE[key]
            try:
                return json.loads(val)
            except Exception:
                return val
    return None


def cache_delete(key: str) -> bool:
    """Delete a key from Redis or in-memory store."""
    client = get_redis_client()
    if client:
        try:
            client.delete(key)
        except Exception as e:
            logger.error(f"Redis delete failed for key '{key}': {e}")

    with _LOCAL_LOCK:
        _LOCAL_STORE.pop(key, None)
        _LOCAL_EXPIRATIONS.pop(key, None)
    return True


def publish_event(channel: str, message: Any) -> bool:
    """Publish real-time trading signal or telemetry event across instances."""
    client = get_redis_client()
    msg_str = json.dumps(message) if not isinstance(message, str) else message

    if client:
        try:
            client.publish(channel, msg_str)
            return True
        except Exception as e:
            logger.error(f"Redis publish failed on channel '{channel}': {e}")
    return False
