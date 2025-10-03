from __future__ import annotations

import logging
import os

from flask import Flask, jsonify
from flask_caching import Cache
from flask_compress import Compress
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flasgger import Swagger
from sqlalchemy import text

from config import config_by_name
from .docs.swagger import swagger_config, swagger_template
from .services.database_service import get_db_session

cache = Cache()
compress = Compress()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per hour", "50 per minute"],
    storage_uri="memory://",
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])
    app.config.setdefault("MAX_CONTENT_LENGTH", 2 * 1024 * 1024)  # 2 MB request cap

    if config_name == "production":
        if not os.getenv("SECRET_KEY"):
            app.logger.warning("SECRET_KEY not set - using auto-generated key (not recommended for production)")

        if not app.config.get("CORS_ORIGINS"):
            app.logger.warning("CORS_ORIGINS not configured - defaulting to restrictive settings")
            app.config["CORS_ORIGINS"] = []

    cors_origins = app.config.get("CORS_ORIGINS", "*")
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": cors_origins,
                "methods": ["GET", "POST", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "expose_headers": ["Content-Disposition"],
                "max_age": 3600,
            }
        },
    )

    if config_name == "production":
        Talisman(
            app,
            force_https=False,  # Railway handles HTTPS at the proxy level
            strict_transport_security=True,
            content_security_policy={
                "default-src": "'self'",
                "script-src": "'self' 'unsafe-inline'",
                "style-src": "'self' 'unsafe-inline'",
                "img-src": "'self' data: https:",
            },
        )

    cache.init_app(
        app,
        config={
            "CACHE_TYPE": app.config.get("CACHE_TYPE", "SimpleCache"),
            "CACHE_DEFAULT_TIMEOUT": app.config.get("CACHE_DEFAULT_TIMEOUT", 300),
        },
    )

    compress.init_app(app)
    limiter.init_app(app)
    Swagger(app, config=swagger_config, template=swagger_template)

    from .routes import api_bp

    app.register_blueprint(api_bp, url_prefix="/api/v1")

    @app.route("/")
    def index():
        return jsonify(
            {
                "message": "BOM Weather Visualization API",
                "version": "1.0.0",
                "status": "running",
            }
        )

    @app.route("/health")
    def health():
        try:
            with get_db_session() as session:
                session.execute(text("SELECT 1"))
            return jsonify({"status": "healthy", "database": "reachable"}), 200
        except Exception:  # pragma: no cover - safety net
            app.logger.exception("Health check failed")
            return (
                jsonify({"status": "unhealthy", "database": "unreachable"}),
                500,
            )

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error("Internal error", exc_info=error)
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(429)
    def ratelimit_handler(error):
        return (
            jsonify(
                {
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                }
            ),
            429,
        )

    return app
