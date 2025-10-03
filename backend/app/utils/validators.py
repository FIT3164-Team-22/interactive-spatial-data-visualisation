from __future__ import annotations

from datetime import datetime
from typing import Optional, Sequence, Tuple

from flask import jsonify

VALID_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]
VALID_METRICS = ["temperature", "rainfall", "humidity", "wind", "evapotranspiration"]
VALID_AGGREGATIONS = ["daily", "weekly", "monthly", "yearly"]

MIN_DATE = datetime(2019, 1, 1).date()
MAX_DATE = datetime(2025, 8, 31).date()
DEFAULT_PAGE_SIZE = 500
MAX_PAGE_SIZE = 2000


def validate_date(date_str: Optional[str], param_name: str = "date"):
    if not date_str:
        return None
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"Invalid {param_name} format. Use YYYY-MM-DD.") from exc

    if date_obj < MIN_DATE or date_obj > MAX_DATE:
        raise ValueError(f"{param_name} must be between {MIN_DATE} and {MAX_DATE}")
    return date_obj


def validate_station_ids(station_ids_str: Optional[str]) -> Optional[Sequence[int]]:
    if not station_ids_str:
        return None
    try:
        ids = [int(x.strip()) for x in station_ids_str.split(",") if x.strip()]
    except ValueError as exc:
        raise ValueError("Invalid station_ids format. Must contain integers.") from exc

    if len(ids) > 50:
        raise ValueError("Maximum 50 stations allowed per request")
    if any(identifier < 1 for identifier in ids):
        raise ValueError("Station IDs must be positive integers")
    return ids


def validate_state(state: Optional[str]) -> Optional[str]:
    if not state:
        return None
    state_upper = state.upper()
    if state_upper not in VALID_STATES:
        raise ValueError(f"Invalid state. Must be one of: {', '.join(VALID_STATES)}")
    return state_upper


def validate_metrics(metrics_str: Optional[str]) -> Optional[Sequence[str]]:
    if not metrics_str:
        return None
    metrics = [metric.strip().lower() for metric in metrics_str.split(",") if metric.strip()]
    invalid = [metric for metric in metrics if metric not in VALID_METRICS]
    if invalid:
        raise ValueError(
            f"Invalid metrics: {', '.join(invalid)}. Valid options: {', '.join(VALID_METRICS)}"
        )
    return metrics


def validate_aggregation(agg: Optional[str]) -> str:
    if not agg:
        return "monthly"
    aggregation = agg.lower()
    if aggregation not in VALID_AGGREGATIONS:
        raise ValueError(
            f"Invalid aggregation. Must be one of: {', '.join(VALID_AGGREGATIONS)}"
        )
    return aggregation


def validate_pagination(page_str: Optional[str], page_size_str: Optional[str]) -> Tuple[int, int]:
    try:
        page = int(page_str) if page_str else 1
    except ValueError as exc:
        raise ValueError("page must be an integer") from exc
    try:
        page_size = int(page_size_str) if page_size_str else DEFAULT_PAGE_SIZE
    except ValueError as exc:
        raise ValueError("page_size must be an integer") from exc

    if page < 1:
        raise ValueError("page must be >= 1")
    if page_size < 1 or page_size > MAX_PAGE_SIZE:
        raise ValueError(
            f"page_size must be between 1 and {MAX_PAGE_SIZE}"
        )
    return page, page_size


def handle_validation_error(error):
    return jsonify({
        "error": "Validation Error",
        "message": str(error),
        "status": 400,
    }), 400
