from flask import Flask
from flask_cors import CORS
from config import config_by_name

def create_app(config_name='development'):
    """Application factory function."""
    app = Flask(__name__)
    
    app.config.from_object(config_by_name[config_name])
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    
    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    @app.route('/')
    def index():
        return "Flask backend is running."

    return app