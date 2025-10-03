from os import environ

bind = '0.0.0.0:' + environ.get('PORT', '8000')
workers = int(environ.get('GUNICORN_WORKERS', '3'))
worker_class = environ.get('GUNICORN_WORKER_CLASS', 'sync')
worker_connections = 1000
keepalive = 5
loglevel = environ.get('GUNICORN_LOG_LEVEL', 'info')
accesslog = '-'
errorlog = '-'
