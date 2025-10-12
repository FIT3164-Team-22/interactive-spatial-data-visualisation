"""Tests for trend_service.py"""
from __future__ import annotations

from datetime import date

import pytest

from app.models import Station, WeatherData
from app.services.trend_service import (
    _generate_interpretation,
    calculate_trend,
)


@pytest.fixture()
def trend_sample_data(session):
    """Create sample data with clear trends for testing."""
    station = Station(
        id=700,
        state="VIC",
        station_name="Melbourne",
        latitude=-37.8136,
        longitude=144.9631,
    )
    session.add(station)
    session.flush()

    # Create data with increasing trend
    records = [
        WeatherData(
            station_id=700,
            date=date(2024, 1, day + 1),
            temp_max_c=15.0 + day * 0.5,  # Clear increasing trend
            temp_min_c=10.0 + day * 0.3,
            rainfall_mm=50.0 - day * 1.0,  # Clear decreasing trend
            humidity_max_percent=70.0 + day * 0.05,  # Very slight increase (stable)
            humidity_min_percent=50.0,
            wind_speed_ms=10.0 + day * 0.2,
            evapotranspiration_mm=3.0 + day * 0.1,
        )
        for day in range(20)
    ]

    session.add_all(records)
    session.commit()

    yield station, records

    session.query(WeatherData).delete()
    session.query(Station).delete()
    session.commit()


class TestCalculateTrend:
    """Tests for calculate_trend function."""

    def test_calculate_trend_increasing_temperature(self, trend_sample_data):
        """Test trend calculation for increasing temperature."""
        result = calculate_trend(metric="temperature")

        assert "metric" in result
        assert result["metric"] == "temperature"
        assert "trend" in result
        assert result["trend"] == "increasing"
        assert "slope" in result
        assert "intercept" in result
        assert "r_squared" in result
        assert "p_value" in result
        assert "standard_error" in result
        assert "is_significant" in result
        assert "data_points" in result
        assert "interpretation" in result

        # With clear increasing trend, should be significant
        assert result["is_significant"] is True
        assert result["data_points"] == 20

    def test_calculate_trend_decreasing_rainfall(self, trend_sample_data):
        """Test trend calculation for decreasing rainfall."""
        result = calculate_trend(metric="rainfall")

        assert result["metric"] == "rainfall"
        assert result["trend"] == "decreasing"
        assert result["is_significant"] is True
        assert result["data_points"] == 20

    def test_calculate_trend_stable_humidity(self, trend_sample_data):
        """Test trend calculation for stable metric."""
        result = calculate_trend(metric="humidity")

        assert result["metric"] == "humidity"
        # Humidity has very slight increase but should be close to stable
        assert result["trend"] in ["increasing", "stable"]
        assert result["data_points"] == 20

    def test_calculate_trend_with_station_filter(self, trend_sample_data):
        """Test trend calculation with station ID filter."""
        result = calculate_trend(metric="temperature", station_ids=[700])

        assert "error" not in result
        assert result["data_points"] == 20

    def test_calculate_trend_with_date_range(self, trend_sample_data):
        """Test trend calculation with date range."""
        result = calculate_trend(
            metric="temperature",
            start_date="2024-01-05",
            end_date="2024-01-15",
        )

        assert "error" not in result
        assert result["data_points"] == 11  # 5th to 15th inclusive

    def test_calculate_trend_insufficient_data(self, session):
        """Test trend calculation with insufficient data points."""
        station = Station(
            id=800,
            state="VIC",
            station_name="Melbourne",
            latitude=-37.8136,
            longitude=144.9631,
        )
        session.add(station)
        session.flush()

        # Create only 2 records (minimum is 3)
        records = [
            WeatherData(
                station_id=800,
                date=date(2024, 1, i + 1),
                temp_max_c=20.0 + i,
                temp_min_c=10.0,
                rainfall_mm=1.0,
                humidity_max_percent=70.0,
                humidity_min_percent=50.0,
                wind_speed_ms=5.0,
                evapotranspiration_mm=2.0,
            )
            for i in range(2)
        ]
        session.add_all(records)
        session.commit()

        result = calculate_trend(metric="temperature")

        assert "error" in result
        assert "Insufficient data points" in result["error"]
        assert result["data_points"] == 2

    def test_calculate_trend_invalid_metric(self, trend_sample_data):
        """Test trend calculation with invalid metric."""
        result = calculate_trend(metric="invalid_metric")

        assert "error" in result
        assert "Invalid metric" in result["error"]

    def test_calculate_trend_wind_speed(self, trend_sample_data):
        """Test trend calculation for wind speed metric."""
        result = calculate_trend(metric="wind")

        assert result["metric"] == "wind"
        assert "trend" in result
        assert result["data_points"] == 20

    def test_calculate_trend_evapotranspiration(self, trend_sample_data):
        """Test trend calculation for evapotranspiration metric."""
        result = calculate_trend(metric="evapotranspiration")

        assert result["metric"] == "evapotranspiration"
        assert "trend" in result
        assert result["data_points"] == 20

    def test_calculate_trend_multiple_stations(self, session):
        """Test trend calculation with multiple stations."""
        stations = [
            Station(
                id=900,
                state="VIC",
                station_name="Melbourne",
                latitude=-37.8136,
                longitude=144.9631,
            ),
            Station(
                id=901,
                state="NSW",
                station_name="Sydney",
                latitude=-33.8688,
                longitude=151.2093,
            ),
        ]
        session.add_all(stations)
        session.flush()

        # Create data for both stations
        records = []
        for station_id in [900, 901]:
            for day in range(10):
                records.append(
                    WeatherData(
                        station_id=station_id,
                        date=date(2024, 1, day + 1),
                        temp_max_c=20.0 + day * 0.5,
                        temp_min_c=10.0,
                        rainfall_mm=1.0,
                        humidity_max_percent=70.0,
                        humidity_min_percent=50.0,
                        wind_speed_ms=5.0,
                        evapotranspiration_mm=2.0,
                    )
                )

        session.add_all(records)
        session.commit()

        # Should average across both stations
        result = calculate_trend(metric="temperature")

        assert "error" not in result
        assert result["data_points"] == 10  # Daily averages across stations

    def test_calculate_trend_with_null_values(self, session):
        """Test trend calculation handles null values correctly."""
        station = Station(
            id=1000,
            state="VIC",
            station_name="Melbourne",
            latitude=-37.8136,
            longitude=144.9631,
        )
        session.add(station)
        session.flush()

        # Create records with some null temperature values
        records = [
            WeatherData(
                station_id=1000,
                date=date(2024, 1, i + 1),
                temp_max_c=20.0 + i if i % 2 == 0 else None,  # Every other is null
                temp_min_c=10.0,
                rainfall_mm=1.0,
                humidity_max_percent=70.0,
                humidity_min_percent=50.0,
                wind_speed_ms=5.0,
                evapotranspiration_mm=2.0,
            )
            for i in range(10)
        ]
        session.add_all(records)
        session.commit()

        # Filter by station ID to isolate this test's data
        result = calculate_trend(metric="temperature", station_ids=[1000])

        # Should only use non-null values
        assert "error" not in result
        assert result["data_points"] == 5  # Only non-null values

    def test_calculate_trend_result_format(self, trend_sample_data):
        """Test that trend result has proper format."""
        result = calculate_trend(metric="temperature")

        # Check that numeric values are formatted as strings
        assert isinstance(result["slope"], str)
        assert isinstance(result["intercept"], str)
        assert isinstance(result["r_squared"], str)
        assert isinstance(result["p_value"], str)
        assert isinstance(result["standard_error"], str)

        # Check that boolean is boolean
        assert isinstance(result["is_significant"], bool)

        # Check that integers are integers
        assert isinstance(result["data_points"], int)

        # Check that strings are strings
        assert isinstance(result["trend"], str)
        assert isinstance(result["interpretation"], str)

    def test_calculate_trend_no_variance(self, session):
        """Test trend calculation when all values are the same."""
        station = Station(
            id=1100,
            state="VIC",
            station_name="Melbourne",
            latitude=-37.8136,
            longitude=144.9631,
        )
        session.add(station)
        session.flush()

        # Create records with constant temperature
        records = [
            WeatherData(
                station_id=1100,
                date=date(2024, 1, i + 1),
                temp_max_c=20.0,  # All the same
                temp_min_c=10.0,
                rainfall_mm=1.0,
                humidity_max_percent=70.0,
                humidity_min_percent=50.0,
                wind_speed_ms=5.0,
                evapotranspiration_mm=2.0,
            )
            for i in range(10)
        ]
        session.add_all(records)
        session.commit()

        # Filter by station ID to isolate this test's data
        result = calculate_trend(metric="temperature", station_ids=[1100])

        assert "error" not in result
        # Slope should be very close to 0
        assert result["trend"] == "stable"


class TestGenerateInterpretation:
    """Tests for _generate_interpretation function."""

    def test_interpretation_significant_increasing(self):
        """Test interpretation for significant increasing trend."""
        result = _generate_interpretation(
            metric="temperature",
            trend="increasing",
            is_significant=True,
            slope=0.5,
            n_points=20,
        )

        assert "Temperature" in result
        assert "increasing" in result
        assert "significant" in result

    def test_interpretation_significant_decreasing(self):
        """Test interpretation for significant decreasing trend."""
        result = _generate_interpretation(
            metric="rainfall",
            trend="decreasing",
            is_significant=True,
            slope=-1.0,
            n_points=20,
        )

        assert "Rainfall" in result
        assert "decreasing" in result
        assert "significant" in result

    def test_interpretation_stable(self):
        """Test interpretation for stable trend."""
        result = _generate_interpretation(
            metric="humidity",
            trend="stable",
            is_significant=True,
            slope=0.0,
            n_points=20,
        )

        assert "Humidity" in result
        assert "stable" in result

    def test_interpretation_not_significant(self):
        """Test interpretation for non-significant trend."""
        result = _generate_interpretation(
            metric="temperature",
            trend="increasing",
            is_significant=False,
            slope=0.1,
            n_points=20,
        )

        assert "Temperature" in result
        assert "no statistically significant" in result
        assert "p ≥ 0.05" in result

    def test_interpretation_all_metrics(self):
        """Test interpretation for all metric types."""
        metrics = ["temperature", "rainfall", "humidity", "wind", "evapotranspiration"]

        for metric in metrics:
            result = _generate_interpretation(
                metric=metric,
                trend="increasing",
                is_significant=True,
                slope=0.5,
                n_points=20,
            )

            assert isinstance(result, str)
            assert len(result) > 0

    def test_interpretation_unknown_metric(self):
        """Test interpretation with unknown metric name."""
        result = _generate_interpretation(
            metric="unknown_metric",
            trend="increasing",
            is_significant=True,
            slope=0.5,
            n_points=20,
        )

        # Should fallback to the metric name itself
        assert "unknown_metric" in result
