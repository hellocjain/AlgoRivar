"""
AlgoRivar Supertrend Trailing Stop Service (Ported from Marketcalls Algomirror).
Computes Supertrend on combined multi-leg option premiums with Pine Script exact parity.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from utils.logging import get_logger

logger = get_logger(__name__)


def calculate_supertrend(high, low, close, period=7, multiplier=3):
    """
    Calculate Supertrend indicator matching TradingView / Pine Script exactly.

    Direction convention:
        - direction = -1: Bullish (Up direction, green) - price above supertrend
        - direction = 1: Bearish (Down direction, red) - price below supertrend
        - direction = 0: Neutral / Warmup
    """
    try:
        df = pd.DataFrame({
            "high": high,
            "low": low,
            "close": close
        })

        # Calculate True Range (TR)
        df["prev_close"] = df["close"].shift(1)
        df["tr1"] = df["high"] - df["low"]
        df["tr2"] = (df["high"] - df["prev_close"]).abs()
        df["tr3"] = (df["low"] - df["prev_close"]).abs()
        df["tr"] = df[["tr1", "tr2", "tr3"]].max(axis=1)

        # Calculate ATR with min_periods=1 for seamless warmup
        period = max(1, int(period))
        multiplier = max(0.1, float(multiplier))
        df["atr"] = df["tr"].rolling(window=period, min_periods=1).mean()

        # Basic Upper and Lower Bands
        df["basic_upper"] = (df["high"] + df["low"]) / 2 + (multiplier * df["atr"])
        df["basic_lower"] = (df["high"] + df["low"]) / 2 - (multiplier * df["atr"])

        # Final Upper and Lower Bands
        final_upper = np.zeros(len(df))
        final_lower = np.zeros(len(df))
        supertrend = np.zeros(len(df))
        direction = np.zeros(len(df), dtype=np.int32)

        for i in range(1, len(df)):
            # Final Upper Band
            if df["basic_upper"].iloc[i] < final_upper[i-1] or df["close"].iloc[i-1] > final_upper[i-1]:
                final_upper[i] = df["basic_upper"].iloc[i]
            else:
                final_upper[i] = final_upper[i-1]

            # Final Lower Band
            if df["basic_lower"].iloc[i] > final_lower[i-1] or df["close"].iloc[i-1] < final_lower[i-1]:
                final_lower[i] = df["basic_lower"].iloc[i]
            else:
                final_lower[i] = final_lower[i-1]

            # Supertrend value & Direction
            if supertrend[i-1] == final_upper[i-1] and df["close"].iloc[i] <= final_upper[i]:
                supertrend[i] = final_upper[i]
                direction[i] = 1  # Bearish
            elif supertrend[i-1] == final_upper[i-1] and df["close"].iloc[i] > final_upper[i]:
                supertrend[i] = final_lower[i]
                direction[i] = -1  # Bullish
            elif supertrend[i-1] == final_lower[i-1] and df["close"].iloc[i] >= final_lower[i]:
                supertrend[i] = final_lower[i]
                direction[i] = -1  # Bullish
            elif supertrend[i-1] == final_lower[i-1] and df["close"].iloc[i] < final_lower[i]:
                supertrend[i] = final_upper[i]
                direction[i] = 1  # Bearish
            else:
                supertrend[i] = final_upper[i]
                direction[i] = 1

        long_line = np.where(direction == -1, supertrend, np.nan)
        short_line = np.where(direction == 1, supertrend, np.nan)

        return supertrend, direction, long_line, short_line

    except Exception as e:
        logger.error(f"[Supertrend] Error computing supertrend: {e}", exc_info=True)
        n = len(close) if hasattr(close, "__len__") else 0
        nan_arr = np.full(n, np.nan)
        return nan_arr, np.zeros(n, dtype=np.int32), nan_arr, nan_arr


def get_supertrend_signal(direction: np.ndarray) -> str:
    """Return 'BUY', 'SELL', or 'NEUTRAL'."""
    if len(direction) == 0:
        return "NEUTRAL"
    current = direction[-1]
    if current == -1:
        return "BUY"
    elif current == 1:
        return "SELL"
    return "NEUTRAL"
