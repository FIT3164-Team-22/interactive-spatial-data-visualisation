"""Tests for statistics_service.py"""
from __future__ import annotations

from datetime import date

import pytest

from app.models import Station, WeatherData
from app.services.statistics_service import (
    _calculate_correlations,
    _correlation_strength,
    _format_metric_name,
    calculate_statistics,
)


@pytest.fixture()
def rich_sample_data(session):
    """Create a richer dataset for statistical analysis."""
    stations = [
        Station(
            id=1,
            state="VIC",
            station_name="Melbourne",
            latitude=-37.8136,
            longitude=144.9631,
        ),
        Station(
            id=2,
            state="NSW",
            station_name="Sydney",
            latitude=-33.8688,
            longitude=151.2093,
        ),
    ]
    session.add_all(stations)
    session.flush()

    # Create weather data with realistic patterns
    records = []
    for day in range(30):
        # Melbourne data
        records.append(
            WeatherData(
                station_id=1,
                date=date(2024, 1, day + 1),
                temp_max_c=20.0 + day * 0.5,
                temp_min_c=10.0 + day * 0.3,
                rainfall_mm=2.0 + day * 0.2,
                humidity_max_percent=80.0 - day * 0.5,
                humidity_min_percent=50.0 - day * 0.3,
                wind_speed_ms=5.0 + day * 0.1,
                evapotranspiration_mm=3.0 + day * 0.15,
            )
        )
        # Sydney data
        records.append(
            WeatherData(
                station_id=2,
                date=date(2024, 1, day + 1),
                temp_max_c=25.0 + day * 0.4,
                temp_min_c=15.0 + day * 0.2,
                rainfall_mm=1.5 + day * 0.25,
                humidity_max_percent=75.0 - day * 0.4,
                humidity_min_percent=45.0 - day * 0.2,
                wind_speed_ms=6.0 + day * 0.15,
                evapotranspiration_mm=3.5 + day * 0.2,
            )
        )

    session.add_all(records)
    session.commit()

    yield stations, records

    session.query(WeatherData).delete()
    session.query(Station).delete()
    session.commit()


class TestCalculateStatistics:
    """Tests for calculate_statistics function."""

    def test_calculate_statistics_with_valid_data(self, rich_sample_data):
        """Test statistics calculation with valid data."""
        result = calculate_statistics()

        assert "statistics" in result
        assert "dominant_factor" in result
        assert "correlations" in result
        assert "sample_size" in result

        # Check that statistics contain expected metrics
        stats = result["statistics"]
        assert "temp_max" in stats
        assert "temp_min" in stats
        assert "rainfall" in stats
        assert "humidity_max" in stats
        assert "wind_speed" in stats

        # Check that each metric has required fields
        for metric_stats in stats.values():
            assert "mean" in metric_stats
            assert "std" in metric_stats
            assert "min" in metric_stats
            assert "max" in metric_stats
            assert "median" in metric_stats
            assert "count" in metric_stats

        # Verify sample size
        assert result["sample_size"] == 60  # 30 days * 2 stations

    def test_calculate_statistics_with_station_filter(self, rich_sample_data):
        """Test statistics calculation filtered by station ID."""
        result = calculate_statistics(station_ids=[1])

        assert "statistics" in result
        assert result["sample_size"] == 30  # Only station 1 data

    def test_calculate_statistics_with_date_range(self, rich_sample_data):
        """Test statistics calculation with date range filter."""
        result = calculate_statistics(
            start_date="2024-01-05",
            end_date="2024-01-10",
        )

        assert "statistics" in result
        # Should have 6 days * 2 stations = 12 records
        assert result["sample_size"] == 12

    def test_calculate_statistics_with_state_filter(self, rich_sample_data):
        """Test statistics calculation filtered by state."""
        result = calculate_statistics(state="VIC")

        assert "statistics" in result
        assert result["sample_size"] == 30  # Only VIC station

    def test_calculate_statistics_insufficient_data(self, session):
        """Test statistics calculation with insufficient data."""
        # Create only 1 record
        station = Station(
            id=500,
            state="VIC",
            station_name="Melbourne",
            latitude=-37.8136,
            longitude=144.9631,
        )
        session.add(station)
        session.flush()

        record = WeatherData(
            station_id=500,
            date=date(2024, 1, 1),
            temp_max_c=25.0,
            temp_min_c=15.0,
            rainfall_mm=1.0,
            humidity_max_percent=70.0,
            humidity_min_percent=40.0,
            wind_speed_ms=5.0,
            evapotranspiration_mm=2.0,
        )
        session.add(record)
        session.commit()

        result = calculate_statistics()

        assert "error" in result
        assert result["error"] == "Insufficient data for analysis"
        assert result["sample_size"] == 1

    def test_calculate_statistics_with_null_values(self, session):
        """Test statistics calculation handles null values correctly."""
        station = Station(
            id=600,
            state="VIC",
            station_name="Melbourne",
            latitude=-37.8136,
            longitude=144.9631,
        )
        session.add(station)
        session.flush()

        # Create records with some null values
        records = [
            WeatherData(
                station_id=600,
                date=date(2024, 1, i + 1),
                temp_max_c=20.0 + i if i % 2 == 0 else None,
                temp_min_c=10.0 + i,
                rainfall_mm=None if i == 0 else 1.0 + i,
                humidity_max_percent=70.0,
                humidity_min_percent=40.0,
                wind_speed_ms=5.0,
                evapotranspiration_mm=2.0,
            )
            for i in range(10)
        ]
        session.add_all(records)
        session.commit()

        # Filter by station ID to isolate this test's data
        result = calculate_statistics(station_ids=[600])

        assert "statistics" in result
        # temp_max should have count of 5 (only even indices: 0, 2, 4, 6, 8)
        assert result["statistics"]["temp_max"]["count"] == 5
        # rainfall should have count of 9 (all except first)
        assert result["statistics"]["rainfall"]["count"] == 9

    def test_calculate_statistics_dominant_factor(self, rich_sample_data):
        """Test that dominant factor is correctly identified."""
        result = calculate_statistics()

        assert "dominant_factor" in result
        assert isinstance(result["dominant_factor"], str)
        # Should be one of the formatted metric names
        assert result["dominant_factor"] in [
            "Maximum Temperature",
            "Minimum Temperature",
            "Rainfall",
            "Maximum Humidity",
            "Minimum Humidity",
            "Wind Speed",
            "Evapotranspiration",
            "N/A",
        ]

    def test_calculate_statistics_correlations_included(self, rich_sample_data):
        """Test that correlations are calculated and included."""
        result = calculate_statistics()

        assert "correlations" in result
        assert isinstance(result["correlations"], list)
        # Should have correlations for the defined pairs
        assert len(result["correlations"]) > 0

        for correlation in result["correlations"]:
            assert "pair" in correlation
            assert "correlation" in correlation
            assert "p_value" in correlation
            assert "strength" in correlation


class TestCalculateCorrelations:
    """Tests for _calculate_correlations function."""

    def test_calculate_correlations_with_sufficient_data(self):
        """Test correlation calculation with sufficient data."""
        metrics = {
            "temp_max": [20.0, 22.0, 24.0, 26.0, 28.0],
            "rainfall": [1.0, 1.5, 2.0, 2.5, 3.0],
            "humidity_max": [80.0, 78.0, 76.0, 74.0, 72.0],
            "wind_speed": [5.0, 5.5, 6.0, 6.5, 7.0],
        }

        result = _calculate_correlations(metrics)

        assert isinstance(result, list)
        assert len(result) > 0

        for correlation in result:
            assert "pair" in correlation
            assert "correlation" in correlation
            assert "p_value" in correlation
            assert "strength" in correlation
            # Correlation should be between -1 and 1
            assert -1 <= correlation["correlation"] <= 1

    def test_calculate_correlations_with_insufficient_data(self):
        """Test correlation calculation with insufficient data points."""
        metrics = {
            "temp_max": [20.0],  # Only 1 data point
            "rainfall": [1.0],
        }

        result = _calculate_correlations(metrics)

        # Should return empty list when insufficient data
        assert isinstance(result, list)
        assert len(result) == 0

    def test_calculate_correlations_with_missing_metrics(self):
        """Test correlation calculation with missing metrics."""
        metrics = {
            "temp_max": [20.0, 22.0, 24.0],
            # rainfall is missing
            "humidity_max": [80.0, 78.0, 76.0],
        }

        result = _calculate_correlations(metrics)

        # Should only include correlations for available pairs
        assert isinstance(result, list)
        # Should have temp_max vs humidity_max correlation
        pairs = [corr["pair"] for corr in result]
        assert "Temperature vs Humidity" in pairs
        # Should not have temp_max vs rainfall
        assert "Temperature vs Rainfall" not in pairs


class TestCorrelationStrength:
    """Tests for _correlation_strength function."""

    def test_strong_positive_correlation(self):
        """Test strong positive correlation classification."""
        assert _correlation_strength(0.8) == "Strong"
        assert _correlation_strength(0.9) == "Strong"
        assert _correlation_strength(1.0) == "Strong"

    def test_strong_negative_correlation(self):
        """Test strong negative correlation classification."""
        assert _correlation_strength(-0.8) == "Strong"
        assert _correlation_strength(-0.9) == "Strong"
        assert _correlation_strength(-1.0) == "Strong"

    def test_moderate_correlation(self):
        """Test moderate correlation classification."""
        assert _correlation_strength(0.5) == "Moderate"
        assert _correlation_strength(0.6) == "Moderate"
        assert _correlation_strength(-0.5) == "Moderate"
        assert _correlation_strength(-0.6) == "Moderate"

    def test_weak_correlation(self):
        """Test weak correlation classification."""
        assert _correlation_strength(0.3) == "Weak"
        assert _correlation_strength(0.2) == "Weak"
        assert _correlation_strength(-0.3) == "Weak"

    def test_very_weak_correlation(self):
        """Test very weak correlation classification."""
        assert _correlation_strength(0.1) == "Very Weak"
        assert _correlation_strength(0.0) == "Very Weak"
        assert _correlation_strength(-0.1) == "Very Weak"

    def test_boundary_values(self):
        """Test boundary values for correlation strength."""
        assert _correlation_strength(0.7) == "Strong"
        assert _correlation_strength(0.699) == "Moderate"
        assert _correlation_strength(0.4) == "Moderate"
        assert _correlation_strength(0.399) == "Weak"
        assert _correlation_strength(0.2) == "Weak"
        assert _correlation_strength(0.199) == "Very Weak"


class TestFormatMetricName:
    """Tests for _format_metric_name function."""

    def test_format_known_metrics(self):
        """Test formatting of known metric names."""
        assert _format_metric_name("temp_max") == "Maximum Temperature"
        assert _format_metric_name("temp_min") == "Minimum Temperature"
        assert _format_metric_name("rainfall") == "Rainfall"
        assert _format_metric_name("humidity_max") == "Maximum Humidity"
        assert _format_metric_name("humidity_min") == "Minimum Humidity"
        assert _format_metric_name("wind_speed") == "Wind Speed"
        assert _format_metric_name("evapotranspiration") == "Evapotranspiration"

    def test_format_unknown_metric(self):
        """Test formatting of unknown metric name."""
        assert _format_metric_name("unknown_metric") == "unknown_metric"

    def test_format_none_metric(self):
        """Test formatting of None metric."""
        assert _format_metric_name(None) == ""

    def test_format_empty_string(self):
        """Test formatting of empty string metric."""
        assert _format_metric_name("") == ""
