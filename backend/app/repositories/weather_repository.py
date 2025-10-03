from __future__ import annotations

from datetime import date
from typing import Iterable, List, Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import Station, WeatherData


class WeatherRepository:
    """Data access layer for weather observations."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def fetch_weather(
        self,
        *,
        station_ids: Optional[Sequence[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 500,
    ) -> Tuple[List[WeatherData], int]:
        base_stmt = select(WeatherData)

        if station_ids:
            base_stmt = base_stmt.where(WeatherData.station_id.in_(station_ids))
        if start_date:
            base_stmt = base_stmt.where(WeatherData.date >= start_date)
        if end_date:
            base_stmt = base_stmt.where(WeatherData.date <= end_date)

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = int(self._session.execute(count_stmt).scalar_one())

        stmt = (
            base_stmt.options(selectinload(WeatherData.station))
            .order_by(WeatherData.date)
            .limit(page_size)
            .offset((page - 1) * page_size)
        )
        items = self._session.execute(stmt).scalars().all()
        return items, total

    def fetch_latest_metric_values(
        self,
        *,
        column,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Tuple[int, str, float, float, str, Optional[float]]]:
        if start_date or end_date:
            stmt = (
                select(
                    Station.id,
                    Station.station_name,
                    Station.latitude,
                    Station.longitude,
                    Station.state,
                    func.avg(column).label("value"),
                )
                .join(WeatherData, Station.id == WeatherData.station_id)
            )
            if start_date:
                stmt = stmt.where(WeatherData.date >= start_date)
            if end_date:
                stmt = stmt.where(WeatherData.date <= end_date)
            stmt = stmt.group_by(Station.id)
        else:
            latest_subquery = (
                select(
                    WeatherData.station_id,
                    func.max(WeatherData.date).label("max_date"),
                )
                .group_by(WeatherData.station_id)
                .subquery()
            )

            stmt = (
                select(
                    Station.id,
                    Station.station_name,
                    Station.latitude,
                    Station.longitude,
                    Station.state,
                    column.label("value"),
                )
                .join(WeatherData, Station.id == WeatherData.station_id)
                .join(
                    latest_subquery,
                    (WeatherData.station_id == latest_subquery.c.station_id)
                    & (WeatherData.date == latest_subquery.c.max_date),
                )
            )

        stmt = stmt.order_by(Station.state, Station.station_name)
        return self._session.execute(stmt).all()

    def fetch_aggregations(
        self,
        *,
        metric,
        aggregation: str,
        station_ids: Optional[Iterable[int]] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Tuple]:
        aggregation_map = {
            "daily": func.strftime("%Y-%m-%d", WeatherData.date),
            "weekly": func.strftime("%Y-W%W", WeatherData.date),
            "monthly": func.strftime("%Y-%m", WeatherData.date),
            "yearly": func.strftime("%Y", WeatherData.date),
        }
        period_expr = aggregation_map.get(aggregation, aggregation_map["monthly"])

        stmt = (
            select(
                WeatherData.station_id,
                Station.station_name,
                period_expr.label("period"),
                func.avg(metric).label("avg_value"),
                func.min(metric).label("min_value"),
                func.max(metric).label("max_value"),
            )
            .join(Station, WeatherData.station_id == Station.id)
        )

        if station_ids:
            stmt = stmt.where(WeatherData.station_id.in_(tuple(station_ids)))
        if start_date:
            stmt = stmt.where(WeatherData.date >= start_date)
        if end_date:
            stmt = stmt.where(WeatherData.date <= end_date)

        stmt = stmt.group_by(WeatherData.station_id, period_expr).order_by(period_expr)
        return self._session.execute(stmt).all()

    def fetch_statistics_dataset(
        self,
        *,
        station_ids: Optional[Iterable[int]] = None,
        state: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[Tuple]:
        stmt = (
            select(
                WeatherData.temp_max_c,
                WeatherData.temp_min_c,
                WeatherData.rainfall_mm,
                WeatherData.humidity_max_percent,
                WeatherData.humidity_min_percent,
                WeatherData.wind_speed_ms,
                WeatherData.evapotranspiration_mm,
            )
            .join(Station, WeatherData.station_id == Station.id)
        )

        if station_ids:
            stmt = stmt.where(WeatherData.station_id.in_(tuple(station_ids)))
        if state:
            stmt = stmt.where(Station.state == state.upper())
        if start_date:
            stmt = stmt.where(WeatherData.date >= start_date)
        if end_date:
            stmt = stmt.where(WeatherData.date <= end_date)

        return self._session.execute(stmt).all()
