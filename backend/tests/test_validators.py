from __future__ import annotations

import pytest

from app.utils import validators


def test_validate_date_valid():
    result = validators.validate_date("2024-01-15", "start_date")
    assert result.year == 2024
    assert result.month == 1
    assert result.day == 15


def test_validate_date_invalid_format():
    with pytest.raises(ValueError):
        validators.validate_date("15-01-2024", "start_date")


def test_validate_metrics():
    metrics = validators.validate_metrics("temperature, rainfall")
    assert metrics == ["temperature", "rainfall"]


def test_validate_metrics_invalid():
    with pytest.raises(ValueError):
        validators.validate_metrics("temperature,pressure")


def test_validate_pagination_defaults():
    page, page_size = validators.validate_pagination(None, None)
    assert page == 1
    assert page_size == validators.DEFAULT_PAGE_SIZE


def test_validate_pagination_bounds():
    with pytest.raises(ValueError):
        validators.validate_pagination("0", "10")
    with pytest.raises(ValueError):
        validators.validate_pagination("1", str(validators.MAX_PAGE_SIZE + 1))
