#!/bin/sh
set -eu

DEFAULT_BACKEND_URL="http://backend:8000"

if [ "${BACKEND_URL:-}" = "" ]; then
  if [ "${BACKEND_HOST:-}" != "" ]; then
    SCHEME="${BACKEND_SCHEME:-https}"
    BACKEND_URL="${SCHEME}://${BACKEND_HOST}"
    if [ "${BACKEND_PORT:-}" != "" ] && [ "${BACKEND_PORT}" != "80" ] && [ "${BACKEND_PORT}" != "443" ]; then
      BACKEND_URL="${BACKEND_URL}:${BACKEND_PORT}"
    fi
  else
    BACKEND_URL="$DEFAULT_BACKEND_URL"
  fi
fi

export BACKEND_URL

envsubst '${BACKEND_URL}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
