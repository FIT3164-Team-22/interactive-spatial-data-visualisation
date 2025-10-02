from app.services.database_service import get_db_session
from app.models import WeatherData, Station
from sqlalchemy import func
from datetime import datetime

def get_aggregated_data(station_ids=None, start_date=None, end_date=None, metric='temp_max_c', aggregation='monthly'):
    metric_map = {
        'temperature': WeatherData.temp_max_c,
        'rainfall': WeatherData.rainfall_mm,
        'humidity': WeatherData.humidity_max_percent,
        'wind': WeatherData.wind_speed_ms,
        'evapotranspiration': WeatherData.evapotranspiration_mm
    }

    metric_column = metric_map.get(metric, WeatherData.temp_max_c)

    with get_db_session() as session:
        query = session.query(
            WeatherData.station_id,
            Station.station_name
        )

        if aggregation == 'daily':
            query = query.add_columns(
                func.date(WeatherData.date).label('period'),
                func.avg(metric_column).label('avg_value'),
                func.min(metric_column).label('min_value'),
                func.max(metric_column).label('max_value')
            )
        elif aggregation == 'weekly':
            # Group by year and week number (strftime %W = week 00-53)
            query = query.add_columns(
                (func.strftime('%Y-W%W', WeatherData.date)).label('period'),
                func.avg(metric_column).label('avg_value'),
                func.min(metric_column).label('min_value'),
                func.max(metric_column).label('max_value')
            )
        elif aggregation == 'monthly':
            query = query.add_columns(
                func.strftime('%Y-%m', WeatherData.date).label('period'),
                func.avg(metric_column).label('avg_value'),
                func.min(metric_column).label('min_value'),
                func.max(metric_column).label('max_value')
            )
        elif aggregation == 'yearly':
            query = query.add_columns(
                func.strftime('%Y', WeatherData.date).label('period'),
                func.avg(metric_column).label('avg_value'),
                func.min(metric_column).label('min_value'),
                func.max(metric_column).label('max_value')
            )
        else:
            # Default to daily
            query = query.add_columns(
                func.date(WeatherData.date).label('period'),
                func.avg(metric_column).label('avg_value'),
                func.min(metric_column).label('min_value'),
                func.max(metric_column).label('max_value')
            )

        query = query.join(Station)

        if station_ids:
            if isinstance(station_ids, int):
                station_ids = [station_ids]
            query = query.filter(WeatherData.station_id.in_(station_ids))

        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(WeatherData.date >= start_date)

        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(WeatherData.date <= end_date)

        if aggregation == 'daily':
            query = query.group_by(WeatherData.station_id, func.date(WeatherData.date))
        elif aggregation == 'weekly':
            query = query.group_by(WeatherData.station_id, func.strftime('%Y-W%W', WeatherData.date))
        elif aggregation == 'monthly':
            query = query.group_by(WeatherData.station_id, func.strftime('%Y-%m', WeatherData.date))
        elif aggregation == 'yearly':
            query = query.group_by(WeatherData.station_id, func.strftime('%Y', WeatherData.date))
        else:
            # Default to daily
            query = query.group_by(WeatherData.station_id, func.date(WeatherData.date))

        query = query.order_by('period')

        results = query.all()

        return [{
            'station_id': r.station_id,
            'station_name': r.station_name,
            'period': r.period,
            'avg_value': round(r.avg_value, 2) if r.avg_value else None,
            'min_value': round(r.min_value, 2) if r.min_value else None,
            'max_value': round(r.max_value, 2) if r.max_value else None
        } for r in results]
