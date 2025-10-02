import os
import secrets

class Config:
    # Generate a secure random key if not provided
    SECRET_KEY = os.getenv('SECRET_KEY', secrets.token_hex(32))
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "bom_data.db")}')
    CACHE_TYPE = 'SimpleCache'
    CACHE_DEFAULT_TIMEOUT = 300

class DevelopmentConfig(Config):
    DEBUG = True
    CORS_ORIGINS = "*"

class ProductionConfig(Config):
    DEBUG = False
    # Require CORS_ORIGINS in production for security
    CORS_ORIGINS = os.getenv('CORS_ORIGINS')
    if not CORS_ORIGINS:
        raise ValueError("CORS_ORIGINS environment variable must be set in production")
    CORS_ORIGINS = CORS_ORIGINS.split(',')
    CACHE_DEFAULT_TIMEOUT = 600

    # Require SECRET_KEY in production
    if not os.getenv('SECRET_KEY'):
        raise ValueError("SECRET_KEY environment variable must be set in production")

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}