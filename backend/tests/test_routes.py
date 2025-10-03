from __future__ import annotations

from flask import Flask


def test_weather_endpoint_paginated(test_app: Flask, sample_data):
    client = test_app.test_client()
    response = client.get("/api/v1/weather?page=1&page_size=2")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["pagination"]["total_items"] == 5
    assert len(payload["items"]) == 2


def test_health_endpoint(test_app: Flask):
    client = test_app.test_client()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "healthy"


def test_weather_summary_endpoint(test_app: Flask, sample_data):
    client = test_app.test_client()
    response = client.get("/api/v1/weather/summary")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["records_analyzed"] == 5
    assert "metrics" in payload
    assert "temperature_max" in payload["metrics"]
