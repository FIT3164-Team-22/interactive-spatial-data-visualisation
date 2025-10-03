#!/bin/bash
set -e

echo "Starting BOM Weather API initialization..."

# Initialize database if needed
python init_db.py

echo "Database initialization complete. Starting Gunicorn..."

# Start Gunicorn
exec gunicorn wsgi:app -c gunicorn.conf.py
