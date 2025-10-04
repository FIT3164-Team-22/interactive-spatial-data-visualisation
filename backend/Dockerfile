# syntax=docker/dockerfile:1
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p /data && \
    chmod +x start.sh

RUN adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app /data

USER appuser

ENV FLASK_CONFIG=production \
    PORT=8000 \
    DATABASE_URL=sqlite:////data/bom_data.db

CMD ["./start.sh"]
