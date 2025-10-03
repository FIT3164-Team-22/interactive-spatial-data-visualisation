from __future__ import annotations

import pytest

from app.services import export_service


def test_export_weather_csv(sample_data, monkeypatch):
    # allow a small limit to avoid ValueError
    monkeypatch.setattr(export_service, "MAX_EXPORT_ROWS", 10)
    csv_content = export_service.export_weather_csv()
    assert csv_content is not None
    assert "State,Station Name,Date" in csv_content.splitlines()[0]


def test_export_weather_csv_respects_limit(sample_data, monkeypatch):
    monkeypatch.setattr(export_service, "MAX_EXPORT_ROWS", 2)
    with pytest.raises(ValueError):
        export_service.export_weather_csv()
