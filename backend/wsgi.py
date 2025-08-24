import os
from app import create_app

# Get the environment from the ENV variable, default to 'development'
config_name = os.getenv('FLASK_CONFIG', 'development')
app = create_app(config_name)

if __name__ == '__main__':
    # This block is for local, direct execution only (like `python wsgi.py`)
    # The production server will call the `app` object directly.
    app.run()