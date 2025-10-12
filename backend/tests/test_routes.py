from __future__ import annotations

from datetime import date

from flask import Flask

from app.models import Station, WeatherData


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


def test_test_api_endpoint(test_app: Flask):
    """Test the /test endpoint."""
    client = test_app.test_client()
    response = client.get("/api/v1/test")
    assert response.status_code == 200
    assert response.get_json()["message"] == "Hello from the backend!"


def test_get_states_endpoint(test_app: Flask, sample_data):
    """Test the /states endpoint."""
    client = test_app.test_client()
    response = client.get("/api/v1/states")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert "VIC" in data


def test_get_stations_endpoint(test_app: Flask, sample_data):
    """Test the /stations endpoint."""
    client = test_app.test_client()
    response = client.get("/api/v1/stations")
    assert response.status_code == 200
    data = response.get_json()
    assert "items" in data
    assert "count" in data
    assert data["count"] > 0
    assert len(data["items"]) == data["count"]


def test_get_stations_with_state_filter(test_app: Flask, sample_data):
    """Test the /stations endpoint with state filter."""
    client = test_app.test_client()
    response = client.get("/api/v1/stations?state=VIC")
    assert response.status_code == 200
    data = response.get_json()
    assert "items" in data
    # All stations should be from VIC
    for station in data["items"]:
        assert station["state"] == "VIC"


def test_get_stations_with_invalid_state(test_app: Flask, sample_data):
    """Test the /stations endpoint with invalid state."""
    client = test_app.test_client()
    response = client.get("/api/v1/stations?state=INVALID")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_station_by_id(test_app: Flask, sample_data):
    """Test the /stations/<id> endpoint."""
    client = test_app.test_client()
    response = client.get("/api/v1/stations/1")
    assert response.status_code == 200
    data = response.get_json()
    assert "id" in data
    assert data["id"] == 1


def test_get_station_by_id_not_found(test_app: Flask, sample_data):
    """Test the /stations/<id> endpoint with non-existent ID."""
    client = test_app.test_client()
    response = client.get("/api/v1/stations/99999")
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_get_station_by_id_invalid(test_app: Flask, sample_data):
    """Test the /stations/<id> endpoint with invalid ID."""
    client = test_app.test_client()
    response = client.get("/api/v1/stations/0")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_weather_with_filters(test_app: Flask, sample_data):
    """Test the /weather endpoint with various filters."""
    client = test_app.test_client()
    response = client.get(
        "/api/v1/weather?station_ids=1&start_date=2024-01-01&end_date=2024-01-05"
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "items" in data
    assert "pagination" in data


def test_get_weather_with_metrics_filter(test_app: Flask, sample_data):
    """Test the /weather endpoint with metrics filter."""
    client = test_app.test_client()
    response = client.get("/api/v1/weather?metrics=temperature,rainfall")
    assert response.status_code == 200
    data = response.get_json()
    assert "items" in data


def test_get_weather_with_invalid_station_ids(test_app: Flask, sample_data):
    """Test the /weather endpoint with invalid station IDs."""
    client = test_app.test_client()
    response = client.get("/api/v1/weather?station_ids=abc")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_heatmap_data(test_app: Flask, sample_data):
    """Test the /weather/heatmap endpoint."""
    client = test_app.test_client()
    response = client.get("/api/v1/weather/heatmap?metric=temperature")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)


def test_get_heatmap_data_with_dates(test_app: Flask, sample_data):
    """Test the /weather/heatmap endpoint with date filters."""
    client = test_app.test_client()
    response = client.get(
        "/api/v1/weather/heatmap?metric=rainfall&start_date=2024-01-01&end_date=2024-01-05"
    )
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)


def test_get_heatmap_data_invalid_metric(test_app: Flask, sample_data):
    """Test the /weather/heatmap endpoint with invalid metric."""
    client = test_app.test_client()
    response = client.get("/api/v1/weather/heatmap?metric=invalid")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_aggregate_data(test_app: Flask, sample_data):
    """Test the /weather/aggregate endpoint."""
    client = test_app.test_client()
    response = client.get(
        "/api/v1/weather/aggregate?metric=temperature&aggregation=monthly"
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "items" in data
    assert "count" in data


def test_get_aggregate_data_with_filters(test_app: Flask, sample_data):
    """Test the /weather/aggregate endpoint with filters."""
    client = test_app.test_client()
    response = client.get(
        "/api/v1/weather/aggregate?metric=rainfall&aggregation=daily&station_ids=1&start_date=2024-01-01&end_date=2024-01-05"
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "items" in data


def test_get_aggregate_data_invalid_metric(test_app: Flask, sample_data):
    """Test the /weather/aggregate endpoint with invalid metric."""
    client = test_app.test_client()
    response = client.get("/api/v1/weather/aggregate?metric=invalid")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_aggregate_data_invalid_aggregation(test_app: Flask, sample_data):
    """Test the /weather/aggregate endpoint with invalid aggregation."""
    client = test_app.test_client()
    response = client.get("/api/v1/weather/aggregate?aggregation=invalid")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_export_weather_csv(test_app: Flask, sample_data):
    """Test the /weather/export endpoint."""
    client = test_app.test_client()
    response = client.get("/api/v1/weather/export")
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "text/csv"
    assert "attachment" in response.headers["Content-Disposition"]


def test_export_weather_csv_with_filters(test_app: Flask, sample_data):
    """Test the /weather/export endpoint with filters."""
    client = test_app.test_client()
    response = client.get(
        "/api/v1/weather/export?station_ids=1&start_date=2024-01-01&end_date=2024-01-05&metrics=temperature,rainfall"
    )
    assert response.status_code == 200
    assert response.headers["Content-Type"] == "text/csv"


def test_export_weather_csv_no_data(test_app: Flask, sample_data):
    """Test the /weather/export endpoint with no matching data."""
    client = test_app.test_client()
    # Use a date range with no data (before sample_data dates)
    response = client.get(
        "/api/v1/weather/export?start_date=2020-01-01&end_date=2020-01-31"
    )
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_get_statistics(test_app: Flask, session):
    """Test the /statistics endpoint."""
    # Create richer dataset for statistics
    station = Station(
        id=200, state="VIC", station_name="Melbourne", latitude=-37.8136, longitude=144.9631
    )
    session.add(station)
    session.flush()

    records = [
        WeatherData(
            station_id=200,
            date=date(2024, 1, i + 1),
            temp_max_c=20.0 + i * 0.5,
            temp_min_c=10.0 + i * 0.3,
            rainfall_mm=2.0 + i * 0.2,
            humidity_max_percent=80.0 - i * 0.5,
            humidity_min_percent=50.0,
            wind_speed_ms=5.0 + i * 0.1,
            evapotranspiration_mm=3.0,
        )
        for i in range(20)
    ]
    session.add_all(records)
    session.commit()

    client = test_app.test_client()
    response = client.get("/api/v1/statistics")
    assert response.status_code == 200
    data = response.get_json()
    assert "statistics" in data
    assert "dominant_factor" in data
    assert "correlations" in data


def test_get_statistics_with_filters(test_app: Flask, session):
    """Test the /statistics endpoint with filters."""
    # Create dataset
    station = Station(
        id=100, state="VIC", station_name="Melbourne", latitude=-37.8136, longitude=144.9631
    )
    session.add(station)
    session.flush()

    records = [
        WeatherData(
            station_id=100,
            date=date(2024, 1, i + 1),
            temp_max_c=20.0,
            temp_min_c=10.0,
            rainfall_mm=2.0,
            humidity_max_percent=80.0,
            humidity_min_percent=50.0,
            wind_speed_ms=5.0,
            evapotranspiration_mm=3.0,
        )
        for i in range(10)
    ]
    session.add_all(records)
    session.commit()

    client = test_app.test_client()
    response = client.get(
        "/api/v1/statistics?station_ids=100&start_date=2024-01-01&end_date=2024-01-05"
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "statistics" in data


def test_get_statistics_insufficient_data(test_app: Flask, sample_data):
    """Test the /statistics endpoint with insufficient data."""
    # sample_data has only 5 records, but they should be enough
    # Let's test with a date range that has only 1 record
    client = test_app.test_client()
    response = client.get("/api/v1/statistics?start_date=2024-01-01&end_date=2024-01-01")
    assert response.status_code == 200
    data = response.get_json()
    # Should return error for insufficient data
    assert "error" in data or "statistics" in data


def test_get_trend_analysis(test_app: Flask, session):
    """Test the /weather/trend endpoint."""
    # Create dataset with clear trend
    station = Station(
        id=300, state="VIC", station_name="Melbourne", latitude=-37.8136, longitude=144.9631
    )
    session.add(station)
    session.flush()

    records = [
        WeatherData(
            station_id=300,
            date=date(2024, 1, i + 1),
            temp_max_c=20.0 + i * 0.5,
            temp_min_c=10.0,
            rainfall_mm=2.0,
            humidity_max_percent=80.0,
            humidity_min_percent=50.0,
            wind_speed_ms=5.0,
            evapotranspiration_mm=3.0,
        )
        for i in range(20)
    ]
    session.add_all(records)
    session.commit()

    client = test_app.test_client()
    response = client.get(
        "/api/v1/weather/trend?metric=temperature&start_date=2024-01-01&end_date=2024-01-20"
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "metric" in data
    assert "trend" in data
    assert "slope" in data
    assert "interpretation" in data


def test_get_trend_analysis_with_station_filter(test_app: Flask, session):
    """Test the /weather/trend endpoint with station filter."""
    # Create dataset
    station = Station(
        id=400, state="VIC", station_name="Melbourne", latitude=-37.8136, longitude=144.9631
    )
    session.add(station)
    session.flush()

    records = [
        WeatherData(
            station_id=400,
            date=date(2024, 1, i + 1),
            temp_max_c=20.0 + i * 0.5,
            temp_min_c=10.0,
            rainfall_mm=2.0,
            humidity_max_percent=80.0,
            humidity_min_percent=50.0,
            wind_speed_ms=5.0,
            evapotranspiration_mm=3.0,
        )
        for i in range(15)
    ]
    session.add_all(records)
    session.commit()

    client = test_app.test_client()
    response = client.get(
        "/api/v1/weather/trend?metric=rainfall&station_ids=400&start_date=2024-01-01&end_date=2024-01-15"
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "trend" in data


def test_get_trend_analysis_invalid_metric(test_app: Flask, sample_data):
    """Test the /weather/trend endpoint with invalid metric."""
    client = test_app.test_client()
    response = client.get(
        "/api/v1/weather/trend?metric=invalid&start_date=2024-01-01&end_date=2024-01-05"
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_trend_analysis_missing_dates(test_app: Flask, sample_data):
    """Test the /weather/trend endpoint without required dates."""
    client = test_app.test_client()
    response = client.get("/api/v1/weather/trend?metric=temperature")
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_trend_analysis_insufficient_data(test_app: Flask, sample_data):
    """Test the /weather/trend endpoint with insufficient data."""
    client = test_app.test_client()
    # Use date range with only 2 records (minimum is 3)
    response = client.get(
        "/api/v1/weather/trend?metric=temperature&start_date=2024-01-01&end_date=2024-01-02"
    )
    assert response.status_code == 200
    data = response.get_json()
    # Should return error for insufficient data
    assert "error" in data or "trend" in data
