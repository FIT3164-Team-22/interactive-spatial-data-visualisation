from app.services.database_service import get_db_session
from app.models import WeatherData, Station
from sqlalchemy import func
from datetime import datetime
import numpy as np
from scipy import stats as scipy_stats

def calculate_statistics(station_ids=None, start_date=None, end_date=None, state=None):
    """
    Calculate statistical analysis for weather data.
    Returns dominant factors, correlations, and basic statistics.
    """
    with get_db_session() as session:
        query = session.query(
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

        if state:
            query = query.filter(Station.state == state.upper())

        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(WeatherData.date >= start_date)

        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(WeatherData.date <= end_date)

        results = query.all()

        if not results or len(results) < 2:
            return {
                'error': 'Insufficient data for analysis',
                'sample_size': len(results) if results else 0
            }

        data = {
            'temp_max': [r.temp_max_c for r in results if r.temp_max_c is not None],
            'temp_min': [r.temp_min_c for r in results if r.temp_min_c is not None],
            'rainfall': [r.rainfall_mm for r in results if r.rainfall_mm is not None],
            'humidity_max': [r.humidity_max_percent for r in results if r.humidity_max_percent is not None],
            'humidity_min': [r.humidity_min_percent for r in results if r.humidity_min_percent is not None],
            'wind_speed': [r.wind_speed_ms for r in results if r.wind_speed_ms is not None],
            'evapotranspiration': [r.evapotranspiration_mm for r in results if r.evapotranspiration_mm is not None]
        }

        statistics = {}
        variances = {}

        for metric, values in data.items():
            if len(values) > 0:
                arr = np.array(values)
                statistics[metric] = {
                    'mean': round(float(np.mean(arr)), 2),
                    'std': round(float(np.std(arr)), 2),
                    'min': round(float(np.min(arr)), 2),
                    'max': round(float(np.max(arr)), 2),
                    'median': round(float(np.median(arr)), 2),
                    'count': len(values)
                }
                variances[metric] = statistics[metric]['std']

        dominant_factor = max(variances.items(), key=lambda x: x[1])[0] if variances else None

        correlations = []
        metric_pairs = [
            ('temp_max', 'rainfall', 'Temperature vs Rainfall'),
            ('temp_max', 'humidity_max', 'Temperature vs Humidity'),
            ('rainfall', 'humidity_max', 'Rainfall vs Humidity'),
            ('wind_speed', 'temp_max', 'Wind Speed vs Temperature'),
        ]

        for metric1, metric2, label in metric_pairs:
            if len(data[metric1]) > 1 and len(data[metric2]) > 1:
                min_len = min(len(data[metric1]), len(data[metric2]))
                arr1 = np.array(data[metric1][:min_len])
                arr2 = np.array(data[metric2][:min_len])

                if len(arr1) > 1 and len(arr2) > 1:
                    correlation, p_value = scipy_stats.pearsonr(arr1, arr2)
                    correlations.append({
                        'pair': label,
                        'correlation': round(float(correlation), 3),
                        'p_value': round(float(p_value), 4),
                        'strength': _correlation_strength(correlation)
                    })

        return {
            'statistics': statistics,
            'dominant_factor': _format_metric_name(dominant_factor) if dominant_factor else 'N/A',
            'correlations': correlations,
            'sample_size': len(results)
        }

def _correlation_strength(corr):
    """Classify correlation strength."""
    abs_corr = abs(corr)
    if abs_corr >= 0.7:
        return 'Strong'
    elif abs_corr >= 0.4:
        return 'Moderate'
    elif abs_corr >= 0.2:
        return 'Weak'
    else:
        return 'Very Weak'

def _format_metric_name(metric):
    """Format metric name for display."""
    names = {
        'temp_max': 'Maximum Temperature',
        'temp_min': 'Minimum Temperature',
        'rainfall': 'Rainfall',
        'humidity_max': 'Maximum Humidity',
        'humidity_min': 'Minimum Humidity',
        'wind_speed': 'Wind Speed',
        'evapotranspiration': 'Evapotranspiration'
    }
    return names.get(metric, metric)
