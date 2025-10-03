# syntax=docker/dockerfile:1
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN adduser --disabled-password --gecos "" appuser
USER appuser

ENV FLASK_CONFIG=production \
    PORT=8000

CMD ["gunicorn", "wsgi:app", "-c", "gunicorn.conf.py"]
