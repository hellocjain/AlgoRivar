"""
AlgoRivar Dynamic Margin Calculator Service (Ported & Enhanced from Marketcalls Algomirror).
Handles dynamic lot size calculations based on available margin, cash, and trade quality grades (A/B/C/D).
"""

import logging
from datetime import date, datetime
from typing import Any, Dict, Optional, Tuple

from database.copy_trading_db import (
    CopyAccount,
    Session,
    TradeQuality,
    get_all_trade_qualities,
)
from utils.logging import get_logger

logger = get_logger(__name__)


class MarginCalculator:
    """Calculate lot sizes dynamically based on AC Agarwal Symphony XTS margin & trade quality."""

    # Default base margin per lot for option buying (premium budget allocation)
    DEFAULT_OPTION_BUYING_PREMIUM = 20000.0  # ₹20,000 per lot

    # Estimated default margin per lot for option selling (when live quote unavailable)
    DEFAULT_MARGIN_REQUIREMENTS = {
        "NIFTY": {"sell": 135000.0, "futures": 140000.0, "lot_size": 25},
        "BANKNIFTY": {"sell": 140000.0, "futures": 145000.0, "lot_size": 15},
        "SENSEX": {"sell": 140000.0, "futures": 145000.0, "lot_size": 10},
        "FINNIFTY": {"sell": 120000.0, "futures": 125000.0, "lot_size": 25},
        "CRUDEOIL": {"sell": 180000.0, "futures": 180000.0, "lot_size": 100},
        "CRUDEOILM": {"sell": 20000.0, "futures": 20000.0, "lot_size": 10},
        "GOLD": {"sell": 450000.0, "futures": 450000.0, "lot_size": 100},
        "GOLDM": {"sell": 45000.0, "futures": 45000.0, "lot_size": 10},
        "SILVER": {"sell": 280000.0, "futures": 280000.0, "lot_size": 30},
        "SILVERM": {"sell": 48000.0, "futures": 48000.0, "lot_size": 5},
        "SILVERMIC": {"sell": 9500.0, "futures": 9500.0, "lot_size": 1},
        "NATURALGAS": {"sell": 160000.0, "futures": 160000.0, "lot_size": 1250},
        "NATGASMINI": {"sell": 32000.0, "futures": 32000.0, "lot_size": 250},
    }

    def __init__(self, user_id: int = 1):
        self.user_id = user_id

    def get_trade_quality_config(self, quality_grade: str) -> Tuple[float, str]:
        """
        Get margin percentage and source for a given grade ('A', 'B', 'C', 'D').
        Returns (margin_percentage_as_decimal, margin_source: 'available'|'cash').
        """
        grade_clean = quality_grade.upper().replace("GRADE_", "").strip()
        session = Session()
        try:
            tq = session.query(TradeQuality).filter_by(quality_grade=grade_clean, is_active=True).first()
            if tq:
                return float(tq.margin_percentage) / 100.0, str(tq.margin_source or "available")
        except Exception as e:
            logger.error(f"[Margin Calculator] Error fetching trade quality {quality_grade}: {e}")
        finally:
            session.close()

        # Fallback defaults
        fallback = {
            "A": (0.70, "available"),
            "B": (0.50, "available"),
            "C": (0.30, "available"),
            "D": (0.20, "cash"),
        }
        return fallback.get(grade_clean, (0.50, "available"))

    def get_base_underlying(self, symbol: str) -> str:
        """Extract base underlying ticker (e.g., NIFTY24AUG24500CE -> NIFTY)."""
        sym = (symbol or "").upper().strip()
        for base in ["SILVERMIC", "SILVERM", "SILVER", "CRUDEOILM", "CRUDEOIL", "NATGASMINI", "NATURALGAS", "GOLDGUINEA", "GOLDM", "GOLD", "BANKNIFTY", "FINNIFTY", "NIFTY", "SENSEX", "MIDCPNIFTY"]:
            if sym.startswith(base):
                return base
        return sym

    def get_margin_requirement_per_lot(self, symbol: str, action: str = "BUY", is_option: bool = True) -> float:
        """Estimate or retrieve the required margin per lot."""
        base = self.get_base_underlying(symbol)
        req = self.DEFAULT_MARGIN_REQUIREMENTS.get(base, {"sell": 100000.0, "futures": 100000.0, "lot_size": 1})
        if is_option and action.upper() == "BUY":
            return self.DEFAULT_OPTION_BUYING_PREMIUM
        return float(req["sell"] if is_option else req["futures"])

    def calculate_lots_for_account(
        self,
        account: Dict[str, Any],
        symbol: str,
        action: str = "BUY",
        risk_profile: str = "grade_B",
        base_lots: int = 1,
        lot_size: int = 1,
        live_funds: Optional[Dict[str, Any]] = None,
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Calculate dynamically sized lots for an account based on risk profile and live funds.
        """
        sizing_mode = account.get("sizing_mode", "MULTIPLIER")
        max_lot_cap = max(1, int(account.get("max_lot_cap", 50) or 50))
        fixed_qty = max(0, int(account.get("fixed_qty", 0) or 0))
        multiplier = max(0.01, float(account.get("multiplier", 1.0) or 1.0))

        if sizing_mode == "FIXED_LOTS" or fixed_qty > 0:
            lots = max(1, fixed_qty // lot_size) if lot_size > 1 else max(1, fixed_qty)
            return min(lots, max_lot_cap), {"mode": "FIXED_LOTS", "lots": lots}

        if sizing_mode == "MULTIPLIER" and (risk_profile == "fixed_lots" or not risk_profile):
            lots = max(1, int(round(base_lots * multiplier)))
            return min(lots, max_lot_cap), {"mode": "MULTIPLIER", "lots": lots}

        # DYNAMIC_MARGIN mode
        margin_pct, margin_source = self.get_trade_quality_config(risk_profile)
        
        available_cash = 0.0
        net_margin = 0.0
        if live_funds:
            available_cash = float(live_funds.get("availablecash", 0.0) or 0.0)
            net_margin = float(live_funds.get("availablecash", 0.0) or live_funds.get("net_margin", 0.0) or 0.0)
        else:
            net_margin = float(account.get("last_funds", 0.0) or 0.0)
            available_cash = net_margin

        capital = max(0.0, available_cash if margin_source == "cash" else net_margin)
        if capital <= 0:
            logger.warning(f"[Margin Calculator] Account {account.get('account_name')} has <= 0 capital. Using fallback 1 lot.")
            return 1, {"mode": "DYNAMIC_FALLBACK", "reason": "No capital recorded", "lots": 1}

        effective_margin = capital * margin_pct
        is_option = ("CE" in symbol.upper() or "PE" in symbol.upper())
        margin_per_lot = max(1.0, float(self.get_margin_requirement_per_lot(symbol, action=action, is_option=is_option) or 1.0))

        raw_lots = effective_margin / margin_per_lot
        calculated_lots = max(1, int(raw_lots))
        final_lots = min(calculated_lots, max_lot_cap)

        details = {
            "mode": "DYNAMIC_MARGIN",
            "risk_profile": risk_profile,
            "margin_percentage": f"{margin_pct * 100:.0f}%",
            "margin_source": margin_source,
            "total_capital": capital,
            "effective_margin": effective_margin,
            "margin_per_lot": margin_per_lot,
            "raw_lots": raw_lots,
            "calculated_lots": calculated_lots,
            "final_lots": final_lots,
            "max_lot_cap": max_lot_cap,
        }
        logger.info(f"[Margin Calculator] Sized {account.get('account_name')} ({account.get('client_code')}) for {symbol}: {final_lots} lots ({details['margin_percentage']} of ₹{capital:.2f})")
        return final_lots, details
