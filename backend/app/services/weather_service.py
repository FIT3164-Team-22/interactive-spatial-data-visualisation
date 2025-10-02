from app.services.database_service import get_db_session
from app.models import WeatherData, Station
from sqlalchemy import func
from datetime import datetime

def get_weather_data(station_ids=None, start_date=None, end_date=None, metrics=None):
    with get_db_session() as session:
        query = session.query(WeatherData).join(Station)

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

        weather_records = query.order_by(WeatherData.date).all()

        results = []
        for w in weather_records:
            record = {
                'station_id': w.station_id,
                'station_name': w.station.station_name,
                'state': w.station.state,
                'date': w.date.isoformat(),
            }

            if not metrics or 'evapotranspiration' in metrics:
                record['evapotranspiration_mm'] = w.evapotranspiration_mm
            if not metrics or 'rainfall' in metrics:
                record['rainfall_mm'] = w.rainfall_mm
            if not metrics or 'temperature' in metrics:
                record['temp_max_c'] = w.temp_max_c
                record['temp_min_c'] = w.temp_min_c
            if not metrics or 'humidity' in metrics:
                record['humidity_max_percent'] = w.humidity_max_percent
                record['humidity_min_percent'] = w.humidity_min_percent
            if not metrics or 'wind' in metrics:
                record['wind_speed_ms'] = w.wind_speed_ms

            results.append(record)

        return results

def get_station_latest_values(metric='temp_max_c', start_date=None, end_date=None):
    metric_map = {
        'temperature': WeatherData.temp_max_c,
        'rainfall': WeatherData.rainfall_mm,
        'humidity': WeatherData.humidity_max_percent,
        'wind': WeatherData.wind_speed_ms,
        'evapotranspiration': WeatherData.evapotranspiration_mm
    }

    metric_column = metric_map.get(metric, WeatherData.temp_max_c)

    with get_db_session() as session:
        # If date range provided, calculate average for the period
        if start_date or end_date:
            query = session.query(
                Station.id,
                Station.station_name,
                Station.latitude,
                Station.longitude,
                Station.state,
                func.avg(metric_column).label('value')
            ).join(
                WeatherData, Station.id == WeatherData.station_id
            )

            if start_date:
                if isinstance(start_date, str):
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                query = query.filter(WeatherData.date >= start_date)

            if end_date:
                if isinstance(end_date, str):
                    end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                query = query.filter(WeatherData.date <= end_date)

            query = query.group_by(Station.id)
        else:
            # Use latest values if no date range provided
            subquery = session.query(
                WeatherData.station_id,
                func.max(WeatherData.date).label('max_date')
            ).group_by(WeatherData.station_id).subquery()

            query = session.query(
                Station.id,
                Station.station_name,
                Station.latitude,
                Station.longitude,
                Station.state,
                metric_column.label('value')
            ).join(
                WeatherData, Station.id == WeatherData.station_id
            ).join(
                subquery,
                (WeatherData.station_id == subquery.c.station_id) &
                (WeatherData.date == subquery.c.max_date)
            )

        results = query.all()

        return [{
            'station_id': r.id,
            'station_name': r.station_name,
            'latitude': r.latitude,
            'longitude': r.longitude,
            'state': r.state,
            'value': round(r.value, 2) if r.value else None
        } for r in results]
