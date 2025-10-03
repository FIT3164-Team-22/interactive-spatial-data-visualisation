from __future__ import annotations

from flask import Blueprint, current_app, jsonify, make_response, request

from app import limiter
from app.services import (
    aggregation_service,
    export_service,
    station_service,
    statistics_service,
    weather_service,
)
from app.utils.validators import (
    handle_validation_error,
    validate_aggregation,
    validate_date,
    validate_metrics,
    validate_pagination,
    validate_state,
    validate_station_ids,
)

api_bp = Blueprint("api", __name__)


@api_bp.route("/test")
def test_api():
    """Simple heartbeat endpoint for smoke testing."""
    return jsonify({"message": "Hello from the backend!"})


@api_bp.route("/states")
@limiter.limit("60 per minute")
def get_states():
    """
    Retrieve all supported state/territory codes.
    ---
    responses:
      200:
        description: List of state codes.
    """
    try:
        states = station_service.get_states()
        return jsonify(states)
    except Exception as exc:  # pragma: no cover - safety net
        current_app.logger.exception("Failed to fetch states")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route("/stations")
@limiter.limit("60 per minute")
def get_stations():
    """
    Retrieve metadata for weather stations.
    ---
    parameters:
      - in: query
        name: state
        type: string
        description: Optional Australian state/territory filter.
    responses:
      200:
        description: Paginated station metadata
    """
    try:
        state = validate_state(request.args.get("state"))
        stations = station_service.get_all_stations(state=state)
        return jsonify({"items": stations, "count": len(stations)})
    except ValueError as exc:
        return handle_validation_error(exc)
    except Exception as exc:  # pragma: no cover - safety net
        current_app.logger.exception("Failed to fetch stations")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route("/stations/<int:station_id>")
@limiter.limit("120 per minute")
def get_station(station_id: int):
    """
    Retrieve metadata for a specific station.
    ---
    parameters:
      - in: path
        name: station_id
        type: integer
        required: true
    responses:
      200:
        description: Station metadata
      404:
        description: Station not found
    """
    try:
        if station_id <= 0:
            raise ValueError("Station ID must be a positive integer")
        station = station_service.get_station_by_id(station_id)
        if station:
            return jsonify(station)
        return jsonify({"error": "Station not found"}), 404
    except ValueError as exc:
        return handle_validation_error(exc)
    except Exception as exc:  # pragma: no cover - safety net
        current_app.logger.exception("Failed to fetch station", extra={"station_id": station_id})
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route("/weather")
@limiter.limit("60 per minute")
def get_weather():
    """
    Retrieve paginated weather observations.
    ---
    parameters:
      - in: query
        name: station_ids
        type: string
        description: Comma separated list of station IDs.
      - in: query
        name: start_date
        type: string
        description: Inclusive start date (YYYY-MM-DD).
      - in: query
        name: end_date
        type: string
        description: Inclusive end date (YYYY-MM-DD).
      - in: query
        name: metrics
        type: string
        description: Comma separated metrics filter.
      - in: query
        name: page
        type: integer
        description: Page number (1-indexed).
      - in: query
        name: page_size
        type: integer
        description: Items per page (max 2000).
    responses:
      200:
        description: Weather data payload
    """
    try:
        station_ids = validate_station_ids(request.args.get("station_ids"))
        start_date = validate_date(request.args.get("start_date"), "start_date")
        end_date = validate_date(request.args.get("end_date"), "end_date")
        metrics = validate_metrics(request.args.get("metrics"))
        page, page_size = validate_pagination(
            request.args.get("page"), request.args.get("page_size")
        )

        data = weather_service.get_weather_data(
            station_ids=station_ids,
            start_date=start_date,
            end_date=end_date,
            metrics=metrics,
            page=page,
            page_size=page_size,
        )
        return jsonify(data)
    except ValueError as exc:
        return handle_validation_error(exc)
    except Exception:  # pragma: no cover - safety net
        current_app.logger.exception("Failed to fetch weather data")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route("/weather/heatmap")
@limiter.limit("60 per minute")
def get_heatmap_data():
    """
    Retrieve aggregated values suitable for map heatmaps.
    ---
    parameters:
      - in: query
        name: metric
        type: string
        description: Metric key (temperature, rainfall, humidity, wind, evapotranspiration).
      - in: query
        name: start_date
        type: string
      - in: query
        name: end_date
        type: string
    responses:
      200:
        description: Heatmap friendly dataset
    """
    try:
        metric = request.args.get("metric", "temperature").lower()
        if metric not in ["temperature", "rainfall", "humidity", "wind", "evapotranspiration"]:
            raise ValueError(f"Invalid metric: {metric}")
        start_date = validate_date(request.args.get("start_date"), "start_date")
        end_date = validate_date(request.args.get("end_date"), "end_date")
        data = weather_service.get_station_latest_values(
            metric=metric, start_date=start_date, end_date=end_date
        )
        return jsonify(data)
    except ValueError as exc:
        return handle_validation_error(exc)
    except Exception:  # pragma: no cover - safety net
        current_app.logger.exception("Failed to fetch heatmap data")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route("/weather/aggregate")
@limiter.limit("60 per minute")
def get_aggregate():
    """
    Retrieve aggregated weather summaries.
    ---
    parameters:
      - in: query
        name: station_ids
        type: string
      - in: query
        name: start_date
        type: string
      - in: query
        name: end_date
        type: string
      - in: query
        name: metric
        type: string
      - in: query
        name: aggregation
        type: string
        enum: [daily, weekly, monthly, yearly]
    responses:
      200:
        description: Aggregated dataset
    """
    try:
        station_ids = validate_station_ids(request.args.get("station_ids"))
        start_date = validate_date(request.args.get("start_date"), "start_date")
        end_date = validate_date(request.args.get("end_date"), "end_date")
        metric = request.args.get("metric", "temperature").lower()
        if metric not in ["temperature", "rainfall", "humidity", "wind", "evapotranspiration"]:
            raise ValueError(f"Invalid metric: {metric}")
        aggregation = validate_aggregation(request.args.get("aggregation", "monthly"))

        data = aggregation_service.get_aggregated_data(
            station_ids=station_ids,
            start_date=start_date,
            end_date=end_date,
            metric=metric,
            aggregation=aggregation,
        )
        return jsonify({"items": data, "count": len(data)})
    except ValueError as exc:
        return handle_validation_error(exc)
    except Exception:  # pragma: no cover - safety net
        current_app.logger.exception("Failed to fetch aggregate data")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route("/weather/export")
@limiter.limit("10 per minute")
def export_weather():
    """
    Export weather data to CSV.
    ---
    parameters:
      - in: query
        name: station_ids
        type: string
      - in: query
        name: start_date
        type: string
      - in: query
        name: end_date
        type: string
      - in: query
        name: metrics
        type: string
    responses:
      200:
        description: CSV export
      404:
        description: No data found
    """
    try:
        station_ids = validate_station_ids(request.args.get("station_ids"))
        start_date = validate_date(request.args.get("start_date"), "start_date")
        end_date = validate_date(request.args.get("end_date"), "end_date")
        metrics = validate_metrics(request.args.get("metrics"))

        csv_content = export_service.export_weather_csv(
            station_ids=station_ids,
            start_date=start_date,
            end_date=end_date,
            metrics=metrics,
        )

        if not csv_content:
            return jsonify({"error": "No data found for the given filters"}), 404

        response = make_response(csv_content)
        response.headers["Content-Type"] = "text/csv"
        response.headers["Content-Disposition"] = (
            "attachment; filename=weather_data.csv"
        )
        return response

    except ValueError as exc:
        return handle_validation_error(exc)
    except Exception:  # pragma: no cover - safety net
        current_app.logger.exception("Failed to export weather data")
        return jsonify({"error": "Internal server error"}), 500


@api_bp.route("/statistics")
@limiter.limit("20 per minute")
def get_statistics():
    """
    Retrieve statistical insights for selected filters.
    ---
    parameters:
      - in: query
        name: station_ids
        type: string
      - in: query
        name: start_date
        type: string
      - in: query
        name: end_date
        type: string
      - in: query
        name: state
        type: string
    responses:
      200:
        description: Statistical summary
    """
    try:
        station_ids = validate_station_ids(request.args.get("station_ids"))
        start_date = validate_date(request.args.get("start_date"), "start_date")
        end_date = validate_date(request.args.get("end_date"), "end_date")
        state = validate_state(request.args.get("state"))

        stats = statistics_service.calculate_statistics(
            station_ids=station_ids,
            start_date=start_date,
            end_date=end_date,
            state=state,
        )
        return jsonify(stats)

    except ValueError as exc:
        return handle_validation_error(exc)
    except Exception:  # pragma: no cover - safety net
        current_app.logger.exception("Failed to calculate statistics")
        return jsonify({"error": "Internal server error"}), 500
