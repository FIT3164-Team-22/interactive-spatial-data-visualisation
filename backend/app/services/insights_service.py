from __future__ import annotations

from datetime import datetime, date
from typing import Dict, Iterable, List, Optional, Sequence

from app.models import WeatherData
from app.repositories import WeatherRepository
from app.services.database_service import get_db_session


_METRIC_COLUMNS: Dict[str, WeatherData] = {
    "temperature_max": WeatherData.temp_max_c,
    "temperature_min": WeatherData.temp_min_c,
    "rainfall": WeatherData.rainfall_mm,
    "humidity_max": WeatherData.humidity_max_percent,
    "humidity_min": WeatherData.humidity_min_percent,
    "wind": WeatherData.wind_speed_ms,
    "evapotranspiration": WeatherData.evapotranspiration_mm,
}

_METRIC_LABELS = {
    "temperature_max": "Maximum temperature (°C)",
    "temperature_min": "Minimum temperature (°C)",
    "rainfall": "Daily rainfall (mm)",
    "humidity_max": "Maximum humidity (%)",
    "humidity_min": "Minimum humidity (%)",
    "wind": "Wind speed (m/s)",
    "evapotranspiration": "Evapotranspiration (mm)",
}


def get_weather_summary(
    *,
    station_ids: Optional[Sequence[int]] = None,
    state: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    metrics: Optional[Iterable[str]] = None,
) -> Dict[str, object]:
    metric_keys = _normalise_metric_keys(metrics)
    metric_columns = {key: _METRIC_COLUMNS[key] for key in metric_keys}

    with get_db_session() as session:
        repository = WeatherRepository(session)
        summary = repository.fetch_summary_stats(
            metric_columns=metric_columns,
            station_ids=station_ids,
            state=state,
            start_date=start_date,
            end_date=end_date,
        )

    metrics_payload: Dict[str, Dict[str, object]] = {}
    insights: List[str] = []
    anomalies: List[str] = []

    for key, stats in summary["metrics"].items():
        label = _METRIC_LABELS.get(key, key)
        average = stats.get("average")
        maximum = stats.get("maximum")
        minimum = stats.get("minimum")

        max_anomaly = _anomaly_info(average, maximum)
        min_anomaly = _anomaly_info(average, minimum, low=True)

        metrics_payload[key] = {
            "label": label,
            "count": stats["count"],
            "average": _round(average),
            "minimum": _round(minimum),
            "maximum": _round(maximum),
            "max_record": stats["max_record"],
            "min_record": stats["min_record"],
            "max_anomaly": max_anomaly,
            "min_anomaly": min_anomaly,
        }

        if stats["max_record"]:
            insights.append(
                _format_insight(
                    prefix="Highest",
                    label=label,
                    record=stats["max_record"],
                )
            )
            if max_anomaly["is_anomaly"]:
                anomalies.append(
                    _format_anomaly_message(label, stats["max_record"], max_anomaly, high=True)
                )

        if stats["min_record"] and key not in {"rainfall", "evapotranspiration"}:
            insights.append(
                _format_insight(
                    prefix="Lowest",
                    label=label,
                    record=stats["min_record"],
                )
            )
            if min_anomaly["is_anomaly"]:
                anomalies.append(
                    _format_anomaly_message(label, stats["min_record"], min_anomaly, high=False)
                )

    filters_payload = {
        "station_ids": list(station_ids) if station_ids else None,
        "state": state,
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "metrics": list(metric_keys),
    }

    coverage = {
        "start": summary["earliest"].isoformat() if summary["earliest"] else None,
        "end": summary["latest"].isoformat() if summary["latest"] else None,
    }

    return {
        "filters": filters_payload,
        "records_analyzed": summary["records"],
        "stations_covered": summary["stations"],
        "coverage": coverage,
        "metrics": metrics_payload,
        "insights": insights,
        "anomalies": anomalies,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


def _normalise_metric_keys(metrics: Optional[Iterable[str]]) -> List[str]:
    available = list(_METRIC_COLUMNS.keys())
    if not metrics:
        return available

    requested = []
    for metric in metrics:
        if metric in _METRIC_COLUMNS:
            requested.append(metric)
        elif metric == "temperature":
            requested.extend(["temperature_max", "temperature_min"])
        elif metric == "humidity":
            requested.extend(["humidity_max", "humidity_min"])
    return list(dict.fromkeys(requested)) or available


def _round(value: Optional[float]) -> Optional[float]:
    if value is None:
        return None
    return round(float(value), 2)


def _format_insight(*, prefix: str, label: str, record: Dict[str, object]) -> str:
    value = record["value"]
    value_text = _round(value) if isinstance(value, (int, float)) else value
    date = record["date"]
    station = record["station_name"]
    state = record["state"]
    return f"{prefix} {label.lower()} of {value_text} at {station} ({state}) on {date}."


def _anomaly_info(average: Optional[float], value: Optional[float], *, low: bool = False) -> Dict[str, Optional[float]]:
    if average is None or value is None:
        return {"is_anomaly": False, "percent_deviation": None}

    if average == 0:
        return {"is_anomaly": False, "percent_deviation": None}

    deviation = (average - value) / abs(average) if low else (value - average) / abs(average)
    percent = abs(deviation) * 100
    is_anomaly = percent >= 50 and abs(value - average) >= 0.5
    return {"is_anomaly": is_anomaly, "percent_deviation": round(percent, 1)}

def _format_anomaly_message(label: str, record: Dict[str, object], anomaly: Dict[str, Optional[float]], *, high: bool) -> str:
    percent = anomaly.get("percent_deviation")
    percent_text = "significantly" if percent is None else f"{percent:.0f}%"
    direction = "above" if high else "below"
    return (
        f"{label} deviates {percent_text} {direction} average at {record['station_name']} "
        f"({record['state']}) on {record['date']}."
    )
