import csv
import io
from datetime import datetime
from app.services.database_service import get_db_session
from app.models import WeatherData, Station

def export_weather_csv(station_ids=None, start_date=None, end_date=None, metrics=None):
    """
    Export weather data as CSV with proper formatting and validation.
    """
    with get_db_session() as session:
        query = session.query(
            Station.state,
            Station.station_name,
            WeatherData.date,
            WeatherData.temp_max_c,
            WeatherData.temp_min_c,
            WeatherData.rainfall_mm,
            WeatherData.humidity_max_percent,
            WeatherData.humidity_min_percent,
            WeatherData.wind_speed_ms,
            WeatherData.evapotranspiration_mm
        ).join(Station)

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

        query = query.order_by(WeatherData.date, Station.station_name)
        results = query.all()

        if not results:
            return None

        output = io.StringIO()
        writer = csv.writer(output)

        headers = ['State', 'Station Name', 'Date']

        metric_headers = {
            'temperature': ['Max Temperature (°C)', 'Min Temperature (°C)'],
            'rainfall': ['Rainfall (mm)'],
            'humidity': ['Max Humidity (%)', 'Min Humidity (%)'],
            'wind': ['Wind Speed (m/s)'],
            'evapotranspiration': ['Evapotranspiration (mm)']
        }

        if metrics:
            for metric in metrics:
                if metric in metric_headers:
                    headers.extend(metric_headers[metric])
        else:
            headers.extend([
                'Max Temperature (°C)', 'Min Temperature (°C)',
                'Rainfall (mm)',
                'Max Humidity (%)', 'Min Humidity (%)',
                'Wind Speed (m/s)',
                'Evapotranspiration (mm)'
            ])

        writer.writerow(headers)

        for row in results:
            data = [
                row.state,
                row.station_name,
                row.date.strftime('%Y-%m-%d')
            ]

            if not metrics or 'temperature' in metrics:
                data.extend([
                    row.temp_max_c if row.temp_max_c is not None else '',
                    row.temp_min_c if row.temp_min_c is not None else ''
                ])
            if not metrics or 'rainfall' in metrics:
                data.append(row.rainfall_mm if row.rainfall_mm is not None else '')
            if not metrics or 'humidity' in metrics:
                data.extend([
                    row.humidity_max_percent if row.humidity_max_percent is not None else '',
                    row.humidity_min_percent if row.humidity_min_percent is not None else ''
                ])
            if not metrics or 'wind' in metrics:
                data.append(row.wind_speed_ms if row.wind_speed_ms is not None else '')
            if not metrics or 'evapotranspiration' in metrics:
                data.append(row.evapotranspiration_mm if row.evapotranspiration_mm is not None else '')

            writer.writerow(data)

        csv_content = output.getvalue()
        output.close()

        return csv_content
