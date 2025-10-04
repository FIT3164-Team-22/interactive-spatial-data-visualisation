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

if [ "${BACKEND_HOST_HEADER:-}" = "" ]; then
  BACKEND_HOST_HEADER=$(printf '%s\n' "$BACKEND_URL" | sed -e 's#^[a-zA-Z]*://##' -e 's#/.*##')
fi

if printf '%s' "$BACKEND_URL" | grep -qi '^https://'; then
  PROXY_SSL_DIRECTIVES=$(printf '    proxy_ssl_server_name on;\n    proxy_ssl_name %s;\n' "$BACKEND_HOST_HEADER")
else
  PROXY_SSL_DIRECTIVES=""
fi

export BACKEND_HOST_HEADER
export PROXY_SSL_DIRECTIVES

envsubst '${BACKEND_URL} ${BACKEND_HOST_HEADER} ${PROXY_SSL_DIRECTIVES}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
