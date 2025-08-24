from flask import Blueprint, jsonify
from ftplib import error_perm
from app.services import bom_data_service

api_bp = Blueprint('api', __name__)

@api_bp.route('/test')
def test_api():
    return jsonify({"message": "Hello from the backend!"})

@api_bp.route('/locations/<state>')
def get_locations(state):
    try:
        locations = bom_data_service.get_locations_for_state(state)
        if locations is not None:
            return jsonify(locations)
        else:
            return jsonify({"error": f"State '{state}' not found."}), 404
    except error_perm:
        return jsonify({"error": f"State '{state}' not found on BOM server."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route('/weather/<state>/<location>/<int:year>/<int:month>')
def get_weather(state, location, year, month):
    """
    Synchronously gets weather data for a specific location and time.
    """
    try:
        data = bom_data_service.get_weather_data(state, location, year, month)
        if data is not None:
            return jsonify(data)
        else:
            return jsonify({"error": "No data found for the specified parameters."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500