"""
AlgoRivar Freeze Quantity Handler Service.
Enforces exchange freeze quantity caps across MCX Commodities and NSE/BSE Equity & Derivatives.
"""

import logging
from typing import List, Optional
from database.qty_freeze_db import get_freeze_qty_for_option
from utils.logging import get_logger

logger = get_logger(__name__)

# Default MCX Commodity Freeze Limits
COMMODITY_FREEZE_LIMITS = {
    "CRUDEOIL": 10000,    # 100 lots / 10,000 barrels
    "CRUDEOILM": 10000,
    "GOLD": 10000,        # 10 kg
    "GOLDM": 10000,
    "SILVER": 30000,      # 30 kg
    "SILVERM": 30000,
    "SILVERMIC": 30000,
    "NATURALGAS": 10000,  # 10,000 mmBtu
    "NATGASMINI": 10000,
    "COPPER": 25000,
    "ZINC": 25000,
    "ALUMINIUM": 25000,
}


def get_freeze_limit(symbol: str, exchange: str) -> int:
    """Retrieve maximum allowed single-order quantity for a symbol."""
    sym = (symbol or "").upper().strip()
    ex = (exchange or "").upper().strip()

    # 1. MCX Commodity check
    if "MCX" in ex or any(sym.startswith(k) for k in COMMODITY_FREEZE_LIMITS):
        for key, limit in COMMODITY_FREEZE_LIMITS.items():
            if sym.startswith(key):
                return limit
        return 10000

    # 2. NSE / BSE F&O freeze limit from database
    try:
        freeze_qty = get_freeze_qty_for_option(symbol, exchange)
        if freeze_qty and int(freeze_qty) > 0:
            return int(freeze_qty)
    except Exception as e:
        logger.debug(f"[Freeze Qty] Error fetching freeze quantity from DB for {symbol}: {e}")

    # Fallback standard limits
    if "NIFTY" in sym:
        return 1800
    if "BANKNIFTY" in sym:
        return 900
    if "FINNIFTY" in sym:
        return 1800
    if "SENSEX" in sym:
        return 1000

    return 0  # 0 indicates no freeze splitting required


def slice_quantity(quantity: int, symbol: str, exchange: str) -> List[int]:
    """Slice total quantity into exchange-compliant order chunks."""
    qty = int(quantity)
    if qty <= 0:
        return []

    freeze_limit = get_freeze_limit(symbol, exchange)
    if freeze_limit <= 0 or qty <= freeze_limit:
        return [qty]

    slices = []
    remaining = qty
    while remaining > 0:
        chunk = min(remaining, freeze_limit)
        slices.append(chunk)
        remaining -= chunk

    logger.info(f"[Freeze Quantity Slicer] Sliced {quantity} units of {symbol} into {len(slices)} chunks: {slices}")
    return slices
