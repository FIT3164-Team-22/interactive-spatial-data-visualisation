from datetime import datetime
from flask import jsonify

VALID_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']
VALID_METRICS = ['temperature', 'rainfall', 'humidity', 'wind', 'evapotranspiration']
VALID_AGGREGATIONS = ['daily', 'monthly', 'yearly']

MIN_DATE = datetime(2019, 1, 1).date()
MAX_DATE = datetime(2025, 8, 31).date()

def validate_date(date_str, param_name='date'):
    """Validate and parse date string."""
    if not date_str:
        return None

    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()

        if date_obj < MIN_DATE or date_obj > MAX_DATE:
            raise ValueError(f'{param_name} must be between {MIN_DATE} and {MAX_DATE}')

        return date_obj
    except ValueError as e:
        raise ValueError(f'Invalid {param_name} format. Use YYYY-MM-DD. {str(e)}')

def validate_station_ids(station_ids_str):
    """Validate and parse station IDs."""
    if not station_ids_str:
        return None

    try:
        ids = [int(x.strip()) for x in station_ids_str.split(',')]

        if len(ids) > 50:
            raise ValueError('Maximum 50 stations allowed per request')

        if any(id < 1 for id in ids):
            raise ValueError('Station IDs must be positive integers')

        return ids
    except ValueError as e:
        raise ValueError(f'Invalid station_ids format. {str(e)}')

def validate_state(state):
    """Validate state code."""
    if not state:
        return None

    state_upper = state.upper()
    if state_upper not in VALID_STATES:
        raise ValueError(f'Invalid state. Must be one of: {", ".join(VALID_STATES)}')

    return state_upper

def validate_metrics(metrics_str):
    """Validate and parse metrics."""
    if not metrics_str:
        return None

    metrics = [m.strip().lower() for m in metrics_str.split(',')]

    invalid = [m for m in metrics if m not in VALID_METRICS]
    if invalid:
        raise ValueError(f'Invalid metrics: {", ".join(invalid)}. Valid: {", ".join(VALID_METRICS)}')

    return metrics

def validate_aggregation(agg):
    """Validate aggregation type."""
    if not agg:
        return 'monthly'

    if agg.lower() not in VALID_AGGREGATIONS:
        raise ValueError(f'Invalid aggregation. Must be one of: {", ".join(VALID_AGGREGATIONS)}')

    return agg.lower()

def handle_validation_error(error):
    """Return standardized error response."""
    return jsonify({
        'error': 'Validation Error',
        'message': str(error),
        'status': 400
    }), 400
