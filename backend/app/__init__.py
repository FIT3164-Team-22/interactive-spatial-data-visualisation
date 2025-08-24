import os
from flask import Flask
from flask_cors import CORS
from flask_caching import Cache
from config import config_by_name

cache = Cache()

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])
    
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    cache.init_app(app, config={'CACHE_TYPE': 'SimpleCache'})
    
    from .routes import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    
    @app.route('/')
    def index():
        return "Flask backend is running."

    return app