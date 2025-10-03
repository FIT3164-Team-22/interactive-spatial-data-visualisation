from __future__ import annotations

from app.services import weather_service


def test_get_weather_data_pagination(sample_data):
    station, _ = sample_data
    result = weather_service.get_weather_data(
        station_ids=[station.id],
        page=1,
        page_size=2,
    )
    assert result["pagination"]["page"] == 1
    assert result["pagination"]["page_size"] == 2
    assert result["pagination"]["total_items"] == 5
    assert len(result["items"]) == 2


def test_get_latest_values(sample_data):
    station, _ = sample_data
    data = weather_service.get_station_latest_values(metric="temperature")
    assert any(item["station_id"] == station.id for item in data)
