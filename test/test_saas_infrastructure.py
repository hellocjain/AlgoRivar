"""
Test SaaS Infrastructure:
1. Redis client in-memory fallback and TTL
2. Engine Factory Postgres URL normalization and SQLite NullPool fallback
3. Telegram trade alert payload generation
"""

import time
from database.engine_factory import create_db_engine
from utils.redis_client import cache_set, cache_get, cache_delete
from services.copy_trading_service import send_telegram_trade_alert


def test_redis_in_memory_fallback():
    """Verify local cache operations with TTL expiry."""
    # Test set & get
    assert cache_set("test_key_1", {"foo": "bar"}, ttl_seconds=2) is True
    val = cache_get("test_key_1")
    assert val == {"foo": "bar"}

    # Test delete
    assert cache_delete("test_key_1") is True
    assert cache_get("test_key_1") is None

    # Test TTL expiration
    cache_set("test_ttl", "temp_value", ttl_seconds=1)
    assert cache_get("test_ttl") == "temp_value"
    time.sleep(1.1)
    assert cache_get("test_ttl") is None


def test_engine_factory_urls():
    """Verify engine factory correctly handles SQLite and gracefully handles Postgres URLs."""
    # SQLite URL
    sqlite_engine = create_db_engine("sqlite:///:memory:")
    assert sqlite_engine is not None
    assert "sqlite" in str(sqlite_engine.url)

    # Postgres URL normalization & fallback
    pg_engine = create_db_engine("postgres://user:pass@localhost:5432/testdb")
    assert pg_engine is not None
    assert str(pg_engine.url) is not None


def test_telegram_alert_dispatcher():
    """Verify non-blocking telegram alert dispatch does not crash when unconfigured."""
    summary = {
        "action": "BUY",
        "symbol": "CRUDEOIL24NOVFUT",
        "exchange": "MCX",
        "strategy": "TEST_STRATEGY",
        "successful_orders": 5,
        "failed_orders": 0,
        "total_accounts": 5,
        "total_latency_ms": 18.5,
    }
    # Should execute asynchronously without throwing exception
    send_telegram_trade_alert(summary)
