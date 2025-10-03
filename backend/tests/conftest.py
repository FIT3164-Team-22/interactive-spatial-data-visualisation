from __future__ import annotations

import os
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from app import create_app
from app.models import Base, Station, WeatherData
from app.services import database_service

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session", autouse=True)
def configure_testing_environment():
    os.environ["FLASK_CONFIG"] = "testing"
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL


@pytest.fixture(scope="session")
def test_app():
    engine = create_engine(TEST_DATABASE_URL, future=True)
    TestingSessionLocal = scoped_session(
        sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    )

    # Bind the testing engine to the database service
    database_service.engine = engine
    database_service.SessionLocal = TestingSessionLocal

    Base.metadata.create_all(engine)

    app = create_app("testing")
    with app.app_context():
        yield app

    TestingSessionLocal.remove()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def session(test_app):
    session = database_service.SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture()
def sample_data(session):
    station = Station(
        id=1,
        state="VIC",
        station_name="Melbourne",
        latitude=-37.8136,
        longitude=144.9631,
    )
    session.add(station)
    session.flush()

    records = [
        WeatherData(
            station_id=station.id,
            date=date(2024, 1, index + 1),
            temp_max_c=25.0 + index,
            temp_min_c=15.0 + index,
            rainfall_mm=1.0 * index,
            humidity_max_percent=70.0 - index,
            humidity_min_percent=40.0 - index,
            wind_speed_ms=5.0 + index,
            evapotranspiration_mm=2.0 + index,
        )
        for index in range(5)
    ]
    session.add_all(records)
    session.commit()

    yield station, records

    session.query(WeatherData).delete()
    session.query(Station).delete()
    session.commit()
