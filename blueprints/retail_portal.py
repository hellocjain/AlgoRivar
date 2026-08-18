"""
AlgoRivar Retail Client Self-Service Portal Blueprint.
Provides simplified, secure onboarding for individual AC Agarwal clients to connect their API,
browse authorized master strategies, set custom multipliers, and track personal positions.
"""

from datetime import datetime
from typing import Any, Dict
from flask import Blueprint, jsonify, request, session

from database.copy_trading_db import (
    Session,
    CopyAccount,
    CopyStrategy,
    ClientStrategyMapping,
    add_child_account,
    get_all_strategies,
    get_child_account,
    update_child_account,
    assign_strategy_to_account,
    delete_client_strategy_mapping,
)
from services.copy_trading_service import get_or_refresh_child_token
from utils.logging import get_logger

logger = get_logger(__name__)

retail_portal_bp = Blueprint("retail_portal_bp", __name__, url_prefix="/api/retail")


@retail_portal_bp.route("/connect-broker", methods=["POST"])
def connect_broker():
    """
    Onboard/Update personal AC Agarwal XTS API credentials for the retail client.
    """
    data = request.get_json(force=True, silent=True) or {}
    account_name = data.get("account_name")
    client_code = data.get("client_code")
    api_key = data.get("api_key")
    api_secret = data.get("api_secret")
    api_key_market = data.get("api_key_market") or api_key
    api_secret_market = data.get("api_secret_market") or api_secret

    if not account_name or not client_code or not api_key or not api_secret:
        return jsonify({"status": "error", "message": "account_name, client_code, api_key, and api_secret are required"}), 400

    sizing_mode = str(data.get("sizing_mode", "MULTIPLIER")).strip().upper()
    multiplier = max(0.01, float(data.get("multiplier", 1.0) or 1.0))
    fixed_qty = max(0, int(data.get("fixed_qty", 0) or 0))
    max_lot_cap = max(1, int(data.get("max_lot_cap", 5) or 5))  # Default conservative 5 lots for retail
    max_daily_loss = max(0.0, float(data.get("max_daily_loss", 2000.0) or 2000.0))

    # Check if account exists
    db = Session()
    try:
        existing = db.query(CopyAccount).filter_by(client_code=client_code.strip().upper()).first()
        if existing:
            existing.account_name = account_name.strip()
            existing.set_api_key(api_key.strip())
            existing.set_api_secret(api_secret.strip())
            if api_key_market:
                existing.set_api_key_market(api_key_market.strip())
            if api_secret_market:
                existing.set_api_secret_market(api_secret_market.strip())
            existing.sizing_mode = sizing_mode
            existing.multiplier = multiplier
            existing.fixed_qty = fixed_qty
            existing.max_lot_cap = max_lot_cap
            existing.max_daily_loss = max_daily_loss
            existing.is_active = True
            db.commit()
            account_data = existing.to_dict()
        else:
            res = add_child_account(
                account_name=account_name,
                client_code=client_code,
                api_key=api_key,
                api_secret=api_secret,
                api_key_market=api_key_market,
                api_secret_market=api_secret_market,
                sizing_mode=sizing_mode,
                multiplier=multiplier,
                fixed_qty=fixed_qty,
                max_lot_cap=max_lot_cap,
                max_daily_loss=max_daily_loss,
            )
            account_data = res.get("data", {})

        # Test live connection
        if account_data:
            conn_ok, token, err = get_or_refresh_child_token(account_data, force_refresh=True)
            if conn_ok:
                return jsonify({"status": "success", "message": "AC Agarwal API connected successfully!", "data": account_data})
            else:
                return jsonify({"status": "warning", "message": f"Saved, but connection check returned: {err}", "data": account_data})

        return jsonify({"status": "success", "data": account_data})
    except Exception as e:
        db.rollback()
        logger.error(f"[Retail Portal] Connect broker error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        db.close()


@retail_portal_bp.route("/strategies", methods=["GET"])
def list_marketplace_strategies():
    """
    List available trading strategies in the marketplace for retail subscription.
    """
    strategies = get_all_strategies(active_only=True)
    return jsonify({"status": "success", "strategies": strategies})


@retail_portal_bp.route("/subscribe", methods=["POST"])
def subscribe_strategy():
    """
    Subscribe or toggle retail client subscription to a specific strategy.
    """
    data = request.get_json(force=True, silent=True) or {}
    account_id = data.get("account_id")
    strategy_id = data.get("strategy_id")
    multiplier = max(0.01, float(data.get("multiplier", 1.0) or 1.0))
    fixed_qty = max(0, int(data.get("fixed_qty", 0) or 0))
    max_daily_loss = max(0.0, float(data.get("max_daily_loss", 2000.0) or 2000.0))

    if not account_id or not strategy_id:
        return jsonify({"status": "error", "message": "account_id and strategy_id are required"}), 400

    res = assign_strategy_to_account(
        account_id=int(account_id),
        strategy_id=int(strategy_id),
        multiplier=multiplier,
        fixed_qty=fixed_qty,
        max_daily_loss=max_daily_loss,
    )
    return jsonify(res)


@retail_portal_bp.route("/unsubscribe", methods=["POST"])
def unsubscribe_strategy():
    """
    Unsubscribe from a strategy.
    """
    data = request.get_json(force=True, silent=True) or {}
    mapping_id = data.get("mapping_id")
    if not mapping_id:
        return jsonify({"status": "error", "message": "mapping_id is required"}), 400

    res = delete_client_strategy_mapping(int(mapping_id))
    return jsonify(res)


@retail_portal_bp.route("/positions/<int:account_id>", methods=["GET"])
def get_personal_positions(account_id: int):
    """
    Fetch live positions for a retail client account.
    """
    account = get_child_account(account_id, include_secrets=True)
    if not account:
        return jsonify({"status": "error", "message": "Account not found"}), 404

    conn_ok, token, err = get_or_refresh_child_token(account)
    if not conn_ok or not token:
        return jsonify({"status": "error", "message": f"Connection error: {err}"}), 400

    from broker.acagarwal.baseurl import INTERACTIVE_URL
    import requests
    try:
        url = f"{INTERACTIVE_URL}/portfolio/positions?dayOrNet=NetWise"
        resp = requests.get(url, headers={"Authorization": token, "Content-Type": "application/json"}, timeout=5)
        if resp.status_code == 200:
            pos_data = resp.json().get("result", {}).get("positionList", []) or []
            return jsonify({"status": "success", "positions": pos_data})
        return jsonify({"status": "error", "message": f"Broker returned HTTP {resp.status_code}"}), resp.status_code
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@retail_portal_bp.route("/funds/<int:account_id>", methods=["GET"])
def get_personal_funds(account_id: int):
    """
    Fetch live funds and margin balance for a retail client account.
    """
    account = get_child_account(account_id, include_secrets=True)
    if not account:
        return jsonify({"status": "error", "message": "Account not found"}), 404

    conn_ok, token, err = get_or_refresh_child_token(account)
    if not conn_ok or not token:
        return jsonify({"status": "error", "message": f"Connection error: {err}"}), 400

    from broker.acagarwal.api.funds import get_margin_data
    try:
        funds = get_margin_data(token)
        return jsonify({"status": "success", "funds": funds})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
