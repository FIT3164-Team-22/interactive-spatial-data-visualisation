import os
import secrets


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = os.getenv(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'bom_data.db')}"
    )
    CACHE_TYPE = os.getenv("CACHE_TYPE", "SimpleCache")
    CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", 300))
    MAX_CONTENT_LENGTH = int(os.getenv("REQUEST_MAX_BYTES", 2 * 1024 * 1024))
    COMPRESS_MIMETYPES = [
        "application/json",
        "text/css",
        "text/html",
        "text/javascript",
    ]


class DevelopmentConfig(Config):
    DEBUG = True
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")


class TestingConfig(Config):
    TESTING = True
    DATABASE_URL = "sqlite:///:memory:"
    CORS_ORIGINS = ["http://localhost"]


class ProductionConfig(Config):
    DEBUG = False
    CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", 600))
    CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin]


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
