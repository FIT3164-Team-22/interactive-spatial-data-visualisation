from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__)

@api_bp.route('/test')
def test_api():
    """A simple test endpoint to verify backend communication."""
    return jsonify({"message": "Hello from the backend! It's working!"})