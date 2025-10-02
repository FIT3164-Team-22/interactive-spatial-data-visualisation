import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'a-super-secret-key-that-you-should-change')
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "bom_data.db")}')
    CACHE_TYPE = 'SimpleCache'
    CACHE_DEFAULT_TIMEOUT = 300

class DevelopmentConfig(Config):
    DEBUG = True
    CORS_ORIGINS = "*"

class ProductionConfig(Config):
    DEBUG = False
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',') if os.getenv('CORS_ORIGINS') else '*'
    CACHE_DEFAULT_TIMEOUT = 600

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}