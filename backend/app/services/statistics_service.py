from __future__ import annotations

from typing import Dict, Iterable, List, Optional

import numpy as np
from scipy import stats as scipy_stats

from app.repositories import WeatherRepository
from app.services.database_service import get_db_session
from app.utils.date_utils import parse_iso_date
from app.utils.logging import get_logger

logger = get_logger(__name__)


def calculate_statistics(
    *,
    station_ids: Optional[Iterable[int]] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    state: Optional[str] = None,
) -> Dict[str, object]:
    start = parse_iso_date(start_date)
    end = parse_iso_date(end_date)

    with get_db_session() as session:
        repository = WeatherRepository(session)
        dataset = repository.fetch_statistics_dataset(
            station_ids=station_ids,
            state=state,
            start_date=start,
            end_date=end,
        )

    logger.debug(
        "Fetched statistics dataset",
        extra={"records": len(dataset), "state": state},
    )

    if not dataset or len(dataset) < 2:
        return {"error": "Insufficient data for analysis", "sample_size": len(dataset)}

    columns = (
        "temp_max",
        "temp_min",
        "rainfall",
        "humidity_max",
        "humidity_min",
        "wind_speed",
        "evapotranspiration",
    )
    metrics: Dict[str, List[float]] = {name: [] for name in columns}

    for row in dataset:
        for index, key in enumerate(columns):
            value = row[index]
            if value is not None:
                metrics[key].append(value)

    statistics: Dict[str, Dict[str, float | int]] = {}
    variances: Dict[str, float] = {}

    for key, values in metrics.items():
        if values:
            array = np.array(values)
            statistics[key] = {
                "mean": round(float(np.mean(array)), 2),
                "std": round(float(np.std(array)), 2),
                "min": round(float(np.min(array)), 2),
                "max": round(float(np.max(array)), 2),
                "median": round(float(np.median(array)), 2),
                "count": len(values),
            }
            variances[key] = float(statistics[key]["std"])

    dominant_factor = max(variances, key=variances.get) if variances else None

    correlations = _calculate_correlations(metrics)

    return {
        "statistics": statistics,
        "dominant_factor": _format_metric_name(dominant_factor) if dominant_factor else "N/A",
        "correlations": correlations,
        "sample_size": len(dataset),
    }


def _calculate_correlations(metrics: Dict[str, List[float]]) -> List[Dict[str, object]]:
    correlations: List[Dict[str, object]] = []
    metric_pairs = (
        ("temp_max", "rainfall", "Temperature vs Rainfall"),
        ("temp_max", "humidity_max", "Temperature vs Humidity"),
        ("rainfall", "humidity_max", "Rainfall vs Humidity"),
        ("wind_speed", "temp_max", "Wind Speed vs Temperature"),
    )

    for metric1, metric2, label in metric_pairs:
        values1 = metrics.get(metric1, [])
        values2 = metrics.get(metric2, [])
        min_length = min(len(values1), len(values2))
        if min_length < 2:
            continue
        arr1 = np.array(values1[:min_length])
        arr2 = np.array(values2[:min_length])
        if arr1.size < 2 or arr2.size < 2:
            continue
        correlation, p_value = scipy_stats.pearsonr(arr1, arr2)
        correlations.append(
            {
                "pair": label,
                "correlation": round(float(correlation), 3),
                "p_value": round(float(p_value), 4),
                "strength": _correlation_strength(correlation),
            }
        )

    return correlations


def _correlation_strength(corr: float) -> str:
    abs_corr = abs(corr)
    if abs_corr >= 0.7:
        return "Strong"
    if abs_corr >= 0.4:
        return "Moderate"
    if abs_corr >= 0.2:
        return "Weak"
    return "Very Weak"


def _format_metric_name(metric: Optional[str]) -> str:
    names = {
        "temp_max": "Maximum Temperature",
        "temp_min": "Minimum Temperature",
        "rainfall": "Rainfall",
        "humidity_max": "Maximum Humidity",
        "humidity_min": "Minimum Humidity",
        "wind_speed": "Wind Speed",
        "evapotranspiration": "Evapotranspiration",
    }
    return names.get(metric or "", metric or "")
