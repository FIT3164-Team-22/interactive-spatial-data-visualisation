from __future__ import annotations

import csv
import io
from typing import Iterable, Optional, Sequence

from app.repositories import WeatherRepository
from app.services.database_service import get_db_session
from app.utils.date_utils import parse_iso_date, safe_float
from app.utils.logging import get_logger

logger = get_logger(__name__)

MAX_EXPORT_ROWS = 20000

_metric_headers = {
    "temperature": ["Max Temperature (degC)", "Min Temperature (degC)"],
    "rainfall": ["Rainfall (mm)"],
    "humidity": ["Max Humidity (%)", "Min Humidity (%)"],
    "wind": ["Wind Speed (m/s)"],
    "evapotranspiration": ["Evapotranspiration (mm)"],
}


def export_weather_csv(
    *,
    station_ids: Optional[Sequence[int]] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    metrics: Optional[Iterable[str]] = None,
) -> Optional[str]:
    start = parse_iso_date(start_date)
    end = parse_iso_date(end_date)
    metric_filter = [m.lower() for m in metrics] if metrics else []

    with get_db_session() as session:
        repository = WeatherRepository(session)
        rows, total = repository.fetch_weather(
            station_ids=station_ids,
            start_date=start,
            end_date=end,
            page=1,
            page_size=MAX_EXPORT_ROWS,
        )

        logger.debug(
            "Preparing CSV export",
            extra={"total_rows": total, "metrics": metric_filter or "all"},
        )

        if total == 0:
            return None
        if total > MAX_EXPORT_ROWS:
            raise ValueError(
                f"Export exceeds maximum row limit of {MAX_EXPORT_ROWS}. Please refine your filters."
            )

        output = io.StringIO()
        writer = csv.writer(output)

        headers = ["State", "Station Name", "Date"]
        if metric_filter:
            for metric in metric_filter:
                headers.extend(_metric_headers.get(metric, []))
        else:
            for header_list in _metric_headers.values():
                headers.extend(header_list)
        writer.writerow(headers)

        for row in rows:
            station = row.station
            record = [
                station.state,
                station.station_name.replace("\n", " "),
                row.date.isoformat(),
            ]
            include_all = not metric_filter
            if include_all or "temperature" in metric_filter:
                record.extend([
                    safe_float(row.temp_max_c),
                    safe_float(row.temp_min_c),
                ])
            if include_all or "rainfall" in metric_filter:
                record.append(safe_float(row.rainfall_mm))
            if include_all or "humidity" in metric_filter:
                record.extend([
                    safe_float(row.humidity_max_percent),
                    safe_float(row.humidity_min_percent),
                ])
            if include_all or "wind" in metric_filter:
                record.append(safe_float(row.wind_speed_ms))
            if include_all or "evapotranspiration" in metric_filter:
                record.append(safe_float(row.evapotranspiration_mm))

            writer.writerow(record)

        csv_content = output.getvalue()
        output.close()

    return csv_content
