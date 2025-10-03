from __future__ import annotations

from datetime import date, datetime
from typing import Optional


def parse_iso_date(value: Optional[str] | Optional[date]) -> Optional[date]:
    """Parse a YYYY-MM-DD date string into a date object."""
    if value is None or isinstance(value, date):
        return value
    return datetime.strptime(value, "%Y-%m-%d").date()


def safe_float(value: Optional[float]) -> str:
    """Return a string representation of a float with two decimals."""
    if value is None:
        return ""
    return f"{value:.2f}" if isinstance(value, (int, float)) else str(value)
