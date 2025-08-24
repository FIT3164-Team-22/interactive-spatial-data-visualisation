import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'a-super-secret-key-that-you-should-change')
    # Add other base configurations here

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    # Allow all origins for easy local development
    CORS_ORIGINS = "*"

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    # In production, we MUST restrict this to our frontend's actual domain
    # Example: CORS_ORIGINS = ["https://your-frontend-domain.com"]
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',')

# Dictionary to map environment names to config classes
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
}