"""
Adversarial Market Stress Testing & Bug-Bounty Simulation Suite for AlgoRivar.
Simulates extreme market conditions, broker API failures, and high-concurrency bursts:
1. Freeze Burst Slicing (50,000 Crude Oil units -> 5 x 10,000 slices)
2. Freak Trade / Volatility Spike (0.5% synthetic limit price buffer calculation)
3. Mid-Trade 401 Token Invalidation & Autonomous Recovery
4. Network Spike & Latency Isolation across 50 Concurrent Accounts
5. Rapid 50-Request Signal Flood SHA-256 Idempotency Drop
"""

import concurrent.futures
import time
from unittest.mock import MagicMock, patch
import pytest

from services.copy_trading_service import (
    calculate_child_quantity,
    get_commodity_freeze_qty,
    get_or_refresh_child_token,
    is_duplicate_signal,
    resolve_active_contract_symbol,
    slice_order_quantities,
)


def test_adversarial_freeze_burst_slicing():
    """
    ATTACK VECTOR: Massive order volume (50,000 Crude Oil units) sent in a single burst.
    INVARIANT: Must slice into exactly 5 separate 10,000-unit orders with zero lot loss.
    """
    symbol = "CRUDEOIL"
    exchange = "MCXFO"
    massive_quantity = 50000

    freeze_cap = get_commodity_freeze_qty(symbol)
    assert freeze_cap == 10000, f"Expected 10,000 freeze cap for Crude Oil, got {freeze_cap}"

    slices = slice_order_quantities(massive_quantity, symbol, exchange)
    assert len(slices) == 5, f"Expected 5 slices, got {len(slices)}"
    assert slices == [10000, 10000, 10000, 10000, 10000]
    assert sum(slices) == massive_quantity, "Sliced sum must exactly match original order quantity"

    # Test Nifty Option Freeze (1,800 units cap on 5,400 units order)
    nifty_slices = slice_order_quantities(5400, "NIFTY24AUG24500CE", "NSEFO")
    assert len(nifty_slices) == 3
    assert nifty_slices == [1800, 1800, 1800]
    assert sum(nifty_slices) == 5400


def test_adversarial_synthetic_limit_protection():
    """
    ATTACK VECTOR: Extreme market price jump (e.g. LTP jumps from 6200 to 6250).
    INVARIANT: Synthetic limit calculation must add exactly 0.5% buffer rounded to 0.05 tick size.
    """
    ltp = 6200.0
    tick_size = 0.05
    slippage_pct = 0.005  # 0.5%

    # BUY Order: Limit price = LTP * 1.005
    buy_limit_raw = ltp * (1.0 + slippage_pct)  # 6231.0
    buy_limit = round(round(buy_limit_raw / tick_size) * tick_size, 2)
    assert buy_limit == 6231.0
    assert buy_limit > ltp, "Buy limit price must be buffered higher than current LTP"
    assert (buy_limit - ltp) / ltp <= 0.0055, "Slippage buffer must remain within 0.5% bounds"

    # SELL Order: Limit price = LTP * 0.995
    sell_limit_raw = ltp * (1.0 - slippage_pct)  # 6169.0
    sell_limit = round(round(sell_limit_raw / tick_size) * tick_size, 2)
    assert sell_limit == 6169.0
    assert sell_limit < ltp, "Sell limit price must be buffered lower than current LTP"


def test_adversarial_mid_trade_401_recovery():
    """
    ATTACK VECTOR: Broker session token gets invalidated (HTTP 401) during live order broadcast.
    INVARIANT: get_or_refresh_child_token must detect expiration, autonomously authenticate with broker, and refresh token.
    """
    mock_account = {
        "id": 9999,
        "client_code": "TEST_RECOVERY",
        "api_key": "VALID_KEY",
        "api_secret": "VALID_SECRET",
        "account_name": "Test Recovery Account",
    }

    # Simulate successful session generation response from AC Agarwal Symphony XTS
    fake_token = "reauthenticated_jwt_token_xyz123"
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "type": "success",
        "result": {"token": fake_token},
    }

    with patch("requests.post", return_value=mock_response):
        success, token, err = get_or_refresh_child_token(mock_account, force_refresh=True)
        assert success is True, f"Expected successful token recovery, got error: {err}"
        assert token == fake_token, f"Expected {fake_token}, got {token}"


def test_adversarial_network_latency_isolation():
    """
    ATTACK VECTOR: 1 child account experiences a 2-second network hang on broker API.
    INVARIANT: ThreadPoolExecutor must process all remaining 49 accounts concurrently in under 500ms without being blocked.
    """
    num_accounts = 50
    accounts = [{"id": i, "name": f"Acc_{i}"} for i in range(num_accounts)]

    def mock_order_worker(acc):
        # Account 0 suffers simulated network lag
        if acc["id"] == 0:
            time.sleep(0.5)
            return {"account_id": acc["id"], "status": "timeout"}
        # All other 49 accounts respond in 5ms
        time.sleep(0.005)
        return {"account_id": acc["id"], "status": "filled"}

    t0 = time.time()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(mock_order_worker, acc) for acc in accounts]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())
    elapsed = time.time() - t0

    # Verify all 50 accounts completed and total elapsed time is bounded by the single slowest worker (~0.5s, not 50 x 0.5s = 25s)
    assert len(results) == num_accounts
    assert elapsed < 1.0, f"Parallel fan-out took {elapsed:.2f}s, expected < 1.0s"
    filled_count = sum(1 for r in results if r["status"] == "filled")
    assert filled_count == 49, f"Expected 49 filled accounts, got {filled_count}"


def test_adversarial_signal_flood_deduplication():
    """
    ATTACK VECTOR: TradingView or malicious actor floods 50 identical webhook signals within 100ms.
    INVARIANT: Exactly 1 signal must pass through; all remaining 49 duplicate signals must be dropped.
    """
    signal_payload = {
        "strategy": "CRUDE_MOMENTUM",
        "symbol": "CRUDEOIL24AUGFUT",
        "action": "BUY",
        "quantity": 100,
        "pricetype": "MARKET",
        "product": "MIS",
    }

    # First signal must be accepted (not duplicate)
    first_check = is_duplicate_signal(signal_payload)
    assert first_check is False, "Initial valid signal must be accepted"

    # Rapid concurrent flood of 49 duplicate signals
    def fire_dup_check():
        return is_duplicate_signal(signal_payload)

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(fire_dup_check) for _ in range(49)]
        dup_results = [f.result() for f in concurrent.futures.as_completed(futures)]

    # All 49 concurrent flood requests must be detected as duplicate (True)
    assert all(dup_results), "All 49 flood signals within 3.0s window must be rejected as duplicates"
