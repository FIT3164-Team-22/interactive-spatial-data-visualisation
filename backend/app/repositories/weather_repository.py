from __future__ import annotations

from datetime import date
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

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

    def fetch_summary_stats(
        self,
        *,
        metric_columns: Dict[str, WeatherData],
        station_ids: Optional[Iterable[int]] = None,
        state: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, object]:
        filters = {
            "station_ids": tuple(station_ids) if station_ids else None,
            "state": state.upper() if state else None,
            "start_date": start_date,
            "end_date": end_date,
        }

        base_count_stmt = (
            select(func.count())
            .select_from(WeatherData)
            .join(Station, WeatherData.station_id == Station.id)
        )
        base_count_stmt = self._apply_filters(base_count_stmt, **filters)
        total_records = int(self._session.execute(base_count_stmt).scalar_one())

        distinct_stmt = (
            select(func.count(func.distinct(WeatherData.station_id)))
            .select_from(WeatherData)
            .join(Station, WeatherData.station_id == Station.id)
        )
        distinct_stmt = self._apply_filters(distinct_stmt, **filters)
        station_count = int(self._session.execute(distinct_stmt).scalar_one())

        earliest_stmt = (
            select(func.min(WeatherData.date))
            .select_from(WeatherData)
            .join(Station, WeatherData.station_id == Station.id)
        )
        earliest_stmt = self._apply_filters(earliest_stmt, **filters)
        earliest = self._session.execute(earliest_stmt).scalar_one()

        latest_stmt = (
            select(func.max(WeatherData.date))
            .select_from(WeatherData)
            .join(Station, WeatherData.station_id == Station.id)
        )
        latest_stmt = self._apply_filters(latest_stmt, **filters)
        latest = self._session.execute(latest_stmt).scalar_one()

        metrics_summary = {}
        for key, column in metric_columns.items():
            stats_stmt = (
                select(
                    func.count(column).label("count"),
                    func.avg(column).label("avg"),
                    func.min(column).label("min"),
                    func.max(column).label("max"),
                )
                .select_from(WeatherData)
                .join(Station, WeatherData.station_id == Station.id)
                .where(column.is_not(None))
            )
            stats_stmt = self._apply_filters(stats_stmt, **filters)
            count, avg, min_value, max_value = self._session.execute(stats_stmt).first()

            max_record = self._fetch_extreme_record(
                column=column,
                station_ids=station_ids,
                state=state,
                start_date=start_date,
                end_date=end_date,
                ascending=False,
            )
            min_record = self._fetch_extreme_record(
                column=column,
                station_ids=station_ids,
                state=state,
                start_date=start_date,
                end_date=end_date,
                ascending=True,
            )

            metrics_summary[key] = {
                "count": int(count or 0),
                "average": float(avg) if avg is not None else None,
                "minimum": float(min_value) if min_value is not None else None,
                "maximum": float(max_value) if max_value is not None else None,
                "max_record": max_record,
                "min_record": min_record,
            }

        return {
            "records": total_records,
            "stations": station_count,
            "earliest": earliest,
            "latest": latest,
            "metrics": metrics_summary,
        }

    def _fetch_extreme_record(
        self,
        *,
        column,
        station_ids: Optional[Iterable[int]] = None,
        state: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        ascending: bool,
    ) -> Optional[Dict[str, object]]:
        stmt = (
            select(WeatherData, Station)
            .join(Station, WeatherData.station_id == Station.id)
            .where(column.is_not(None))
        )
        stmt = self._apply_filters(
            stmt,
            station_ids=tuple(station_ids) if station_ids else None,
            state=state.upper() if state else None,
            start_date=start_date,
            end_date=end_date,
        )
        order_clause = column.asc() if ascending else column.desc()
        stmt = stmt.order_by(order_clause, WeatherData.date.asc()).limit(1)
        row = self._session.execute(stmt).first()
        if not row:
            return None
        weather, station = row
        return {
            "station_id": station.id,
            "station_name": station.station_name,
            "state": station.state,
            "date": weather.date.isoformat(),
            "value": getattr(weather, column.key),
        }

    def _apply_filters(
        self,
        stmt,
        *,
        station_ids: Optional[Sequence[int]] = None,
        state: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ):
        if station_ids:
            stmt = stmt.where(WeatherData.station_id.in_(tuple(station_ids)))
        if state:
            stmt = stmt.where(Station.state == state)
        if start_date:
            stmt = stmt.where(WeatherData.date >= start_date)
        if end_date:
            stmt = stmt.where(WeatherData.date <= end_date)
        return stmt
