from __future__ import annotations

from typing import Dict, Iterable, List, Optional

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


def get_aggregated_data(
    *,
    station_ids: Optional[Iterable[int]] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    metric: str = "temperature",
    aggregation: str = "monthly",
) -> List[Dict[str, object]]:
    start = parse_iso_date(start_date)
    end = parse_iso_date(end_date)
    metric_column = _metric_map.get(metric, WeatherData.temp_max_c)

    with get_db_session() as session:
        repository = WeatherRepository(session)
        rows = repository.fetch_aggregations(
            metric=metric_column,
            aggregation=aggregation,
            station_ids=station_ids,
            start_date=start,
            end_date=end,
        )

    logger.debug(
        "Fetched aggregated data",
        extra={"aggregation": aggregation, "metric": metric, "count": len(rows)},
    )

    results: List[Dict[str, object]] = []
    for station_id, station_name, period, avg_value, min_value, max_value in rows:
        results.append(
            {
                "station_id": station_id,
                "station_name": station_name,
                "period": period,
                "avg_value": round(avg_value, 2) if avg_value is not None else None,
                "min_value": round(min_value, 2) if min_value is not None else None,
                "max_value": round(max_value, 2) if max_value is not None else None,
            }
        )
    return results
