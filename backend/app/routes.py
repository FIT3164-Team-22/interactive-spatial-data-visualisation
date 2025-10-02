from flask import Blueprint, jsonify, request, make_response
from app.services import station_service, weather_service, aggregation_service, export_service, statistics_service
from app.utils.validators import (
    validate_date, validate_station_ids, validate_state,
    validate_metrics, validate_aggregation, handle_validation_error
)
from app import limiter

api_bp = Blueprint('api', __name__)

@api_bp.route('/test')
def test_api():
    return jsonify({"message": "Hello from the backend!"})

@api_bp.route('/states')
def get_states():
    try:
        states = station_service.get_states()
        return jsonify(states)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/stations')
def get_stations():
    try:
        state = request.args.get('state')
        stations = station_service.get_all_stations(state=state)
        return jsonify(stations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/stations/<int:station_id>')
def get_station(station_id):
    try:
        station = station_service.get_station_by_id(station_id)
        if station:
            return jsonify(station)
        return jsonify({"error": "Station not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/weather')
def get_weather():
    try:
        station_ids_str = request.args.get('station_ids')
        station_ids = [int(x) for x in station_ids_str.split(',')] if station_ids_str else None
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        metrics = request.args.get('metrics')
        metrics = metrics.split(',') if metrics else None

        data = weather_service.get_weather_data(
            station_ids=station_ids,
            start_date=start_date,
            end_date=end_date,
            metrics=metrics
        )
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/weather/heatmap')
def get_heatmap_data():
    try:
        metric = request.args.get('metric', 'temperature')
        data = weather_service.get_station_latest_values(metric=metric)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/weather/aggregate')
def get_aggregate():
    try:
        station_ids_str = request.args.get('station_ids')
        station_ids = [int(x) for x in station_ids_str.split(',')] if station_ids_str else None
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        metric = request.args.get('metric', 'temperature')
        aggregation = request.args.get('aggregation', 'monthly')

        data = aggregation_service.get_aggregated_data(
            station_ids=station_ids,
            start_date=start_date,
            end_date=end_date,
            metric=metric,
            aggregation=aggregation
        )
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/weather/export')
@limiter.limit("10 per minute")
def export_weather():
    try:
        station_ids = validate_station_ids(request.args.get('station_ids'))
        start_date = validate_date(request.args.get('start_date'), 'start_date')
        end_date = validate_date(request.args.get('end_date'), 'end_date')
        metrics = validate_metrics(request.args.get('metrics'))

        csv_content = export_service.export_weather_csv(
            station_ids=station_ids,
            start_date=start_date,
            end_date=end_date,
            metrics=metrics
        )

        if not csv_content:
            return jsonify({"error": "No data found for the given filters"}), 404

        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = 'attachment; filename=weather_data.csv'
        return response

    except ValueError as e:
        return handle_validation_error(e)
    except Exception as e:
        return jsonify({"error": "Export failed", "message": str(e)}), 500

@api_bp.route('/statistics')
@limiter.limit("20 per minute")
def get_statistics():
    try:
        station_ids = validate_station_ids(request.args.get('station_ids'))
        start_date = validate_date(request.args.get('start_date'), 'start_date')
        end_date = validate_date(request.args.get('end_date'), 'end_date')
        state = validate_state(request.args.get('state'))

        stats = statistics_service.calculate_statistics(
            station_ids=station_ids,
            start_date=start_date,
            end_date=end_date,
            state=state
        )

        return jsonify(stats)

    except ValueError as e:
        return handle_validation_error(e)
    except Exception as e:
        return jsonify({"error": "Statistics calculation failed", "message": str(e)}), 500