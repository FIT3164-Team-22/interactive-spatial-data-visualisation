#!/bin/sh
set -eu

BACKEND_URL="${BACKEND_URL:-http://backend:8000}"
export BACKEND_URL

envsubst '${BACKEND_URL}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
