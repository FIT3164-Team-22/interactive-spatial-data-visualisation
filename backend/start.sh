#!/usr/bin/env bash
set -euo pipefail

export FLASK_CONFIG="${FLASK_CONFIG:-production}"
export DATABASE_URL="${DATABASE_URL:-sqlite:////data/bom_data.db}"

if [[ "${SKIP_DB_BOOTSTRAP:-0}" != "1" ]]; then
  python init_db.py
fi

exec gunicorn wsgi:app -c gunicorn.conf.py
