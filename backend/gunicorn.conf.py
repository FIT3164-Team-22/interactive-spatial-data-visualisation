from os import environ

# Server socket
bind = '0.0.0.0:' + environ.get('PORT', '8000')

# Worker processes
workers = int(environ.get('GUNICORN_WORKERS', '3'))
worker_class = environ.get('GUNICORN_WORKER_CLASS', 'sync')
worker_connections = 1000

# Server mechanics
keepalive = 5
timeout = 120
graceful_timeout = 30

# Logging
loglevel = environ.get('GUNICORN_LOG_LEVEL', 'info')
accesslog = '-'
errorlog = '-'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'bom-weather-api'

# Server hooks
def on_starting(server):
    server.log.info("Starting BOM Weather API")

def when_ready(server):
    server.log.info("Server is ready. Spawning workers")

def on_exit(server):
    server.log.info("Shutting down BOM Weather API")
