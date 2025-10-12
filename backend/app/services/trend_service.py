"""Trend analysis service using linear regression."""
from __future__ import annotations

from typing import Dict, Iterable, Optional

from scipy.stats import linregress
from sqlalchemy import func

from app.models import WeatherData
from app.repositories import WeatherRepository
from app.services.database_service import get_db_session
from app.utils.date_utils import parse_iso_date
from app.utils.logging import get_logger

logger = get_logger(__name__)

_metric_map: Dict[str, WeatherData] = {
    "temperature": WeatherData.temp_max_c,
    "rainfall": WeatherData.rainfall_mm,
    "humidity": WeatherData.humidity_max_percent,
    "wind": WeatherData.wind_speed_ms,
    "evapotranspiration": WeatherData.evapotranspiration_mm,
}


def calculate_trend(
    *,
    station_ids: Optional[Iterable[int]] = None,
    metric: str = "temperature",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, object]:
    """
    Calculate trend for a given metric using linear regression.

    Args:
        station_ids: List of station IDs to filter (None for all)
        metric: Metric name (temperature, rainfall, humidity, wind, evapotranspiration)
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)

    Returns:
        Dictionary containing trend analysis results
    """
    if metric not in _metric_map:
        return {"error": f"Invalid metric: {metric}"}

    metric_column = _metric_map.get(metric, WeatherData.temp_max_c)
    start = parse_iso_date(start_date) if start_date else None
    end = parse_iso_date(end_date) if end_date else None

    # Fetch daily averages
    data = _fetch_timeseries(
        station_ids=station_ids,
        metric_column=metric_column,
        start_date=start,
        end_date=end,
    )

    if len(data) < 3:
        return {
            "error": "Insufficient data points for trend analysis (minimum 3 required)",
            "data_points": len(data),
        }

    # Prepare data for regression
    dates = [row[0] for row in data]
    values = [row[1] for row in data]

    # Convert dates to numeric (days since first date)
    first_date = dates[0]
    x = [(d - first_date).days for d in dates]
    y = values

    # Perform linear regression
    slope, intercept, r_value, p_value, std_err = linregress(x, y)

    # Determine if trend is significant (p < 0.05)
    is_significant = p_value < 0.05

    # Determine trend direction
    if abs(slope) < 1e-10:
        trend = "stable"
    elif slope > 0:
        trend = "increasing"
    else:
        trend = "decreasing"

    # Generate interpretation
    interpretation = _generate_interpretation(metric, trend, is_significant, slope, len(data))

    logger.debug(
        "Calculated trend",
        extra={
            "metric": metric,
            "trend": trend,
            "is_significant": is_significant,
            "data_points": len(data),
        },
    )

    return {
        "metric": metric,
        "trend": trend,
        "slope": f"{slope:.6f}",
        "intercept": f"{intercept:.4f}",
        "r_squared": f"{r_value**2:.4f}",
        "p_value": f"{p_value:.6f}",
        "standard_error": f"{std_err:.6f}",
        "is_significant": bool(is_significant),
        "data_points": int(len(data)),
        "interpretation": interpretation,
    }


def _fetch_timeseries(
    *,
    station_ids: Optional[Iterable[int]],
    metric_column,
    start_date,
    end_date,
) -> list[tuple]:
    """Fetch daily averaged timeseries data."""
    with get_db_session() as session:
        query = (
            session.query(WeatherData.date, func.avg(metric_column).label("value"))
            .filter(metric_column.isnot(None))
        )

        if start_date:
            query = query.filter(WeatherData.date >= start_date)
        if end_date:
            query = query.filter(WeatherData.date <= end_date)
        if station_ids:
            query = query.filter(WeatherData.station_id.in_(list(station_ids)))

        query = query.group_by(WeatherData.date).order_by(WeatherData.date)

        results = query.all()
        return [(row.date, row.value) for row in results]


def _generate_interpretation(metric: str, trend: str, is_significant: bool, slope: float, n_points: int) -> str:
    """Generate human-readable interpretation of trend."""
    metric_labels = {
        "temperature": "Temperature",
        "rainfall": "Rainfall",
        "humidity": "Humidity",
        "wind": "Wind speed",
        "evapotranspiration": "Evapotranspiration",
    }

    label = metric_labels.get(metric, metric)

    if not is_significant:
        return f"{label} shows no statistically significant trend over the selected period (p ≥ 0.05)."

    if trend == "increasing":
        return f"{label} shows a statistically significant increasing trend over the selected period."
    elif trend == "decreasing":
        return f"{label} shows a statistically significant decreasing trend over the selected period."
    else:
        return f"{label} remains relatively stable over the selected period."
