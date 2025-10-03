from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Sequence

from sqlalchemy import Column

from app.models import WeatherData
from app.repositories import WeatherRepository
from app.services.database_service import get_db_session
from app.utils.date_utils import parse_iso_date
from app.utils.logging import get_logger

logger = get_logger(__name__)

DEFAULT_PAGE_SIZE = 500
MAX_PAGE_SIZE = 2000

_metric_map: Dict[str, Column] = {
    "temperature": WeatherData.temp_max_c,
    "rainfall": WeatherData.rainfall_mm,
    "humidity": WeatherData.humidity_max_percent,
    "wind": WeatherData.wind_speed_ms,
    "evapotranspiration": WeatherData.evapotranspiration_mm,
}


def get_weather_data(
    *,
    station_ids: Optional[Sequence[int]] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    metrics: Optional[Iterable[str]] = None,
    page: int = 1,
    page_size: int = DEFAULT_PAGE_SIZE,
) -> Dict[str, object]:
    start = parse_iso_date(start_date) if start_date else None
    end = parse_iso_date(end_date) if end_date else None
    bounded_page = max(page, 1)
    bounded_page_size = min(max(page_size, 1), MAX_PAGE_SIZE)

    with get_db_session() as session:
        repository = WeatherRepository(session)
        records, total = repository.fetch_weather(
            station_ids=station_ids,
            start_date=start,
            end_date=end,
            page=bounded_page,
            page_size=bounded_page_size,
        )

        logger.debug(
            "Fetched weather page",
            extra={
                "total": total,
                "page": bounded_page,
                "page_size": bounded_page_size,
            },
        )

        items: List[Dict[str, object]] = []
        selected_metrics = set(metrics) if metrics else set()
        for row in records:
            record = {
                "station_id": row.station_id,
                "station_name": row.station.station_name,
                "state": row.station.state,
                "date": row.date.isoformat(),
            }
            if not selected_metrics or "evapotranspiration" in selected_metrics:
                record["evapotranspiration_mm"] = row.evapotranspiration_mm
            if not selected_metrics or "rainfall" in selected_metrics:
                record["rainfall_mm"] = row.rainfall_mm
            if not selected_metrics or "temperature" in selected_metrics:
                record["temp_max_c"] = row.temp_max_c
                record["temp_min_c"] = row.temp_min_c
            if not selected_metrics or "humidity" in selected_metrics:
                record["humidity_max_percent"] = row.humidity_max_percent
                record["humidity_min_percent"] = row.humidity_min_percent
            if not selected_metrics or "wind" in selected_metrics:
                record["wind_speed_ms"] = row.wind_speed_ms
            items.append(record)

        total_pages = (total + bounded_page_size - 1) // bounded_page_size if bounded_page_size else 1
        return {
            "items": items,
            "pagination": {
                "page": bounded_page,
                "page_size": bounded_page_size,
                "total_items": total,
                "total_pages": total_pages,
            },
        }


def get_station_latest_values(
    *,
    metric: str = "temperature",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, object]]:
    metric_column = _metric_map.get(metric, WeatherData.temp_max_c)
    start = parse_iso_date(start_date)
    end = parse_iso_date(end_date)

    with get_db_session() as session:
        repository = WeatherRepository(session)
        rows = repository.fetch_latest_metric_values(
            column=metric_column,
            start_date=start,
            end_date=end,
        )

    logger.debug("Fetched heatmap dataset", extra={"metric": metric, "count": len(rows)})

    return [
        {
            "station_id": station_id,
            "station_name": station_name,
            "latitude": latitude,
            "longitude": longitude,
            "state": state,
            "value": round(value, 2) if value is not None else None,
        }
        for station_id, station_name, latitude, longitude, state, value in rows
    ]
