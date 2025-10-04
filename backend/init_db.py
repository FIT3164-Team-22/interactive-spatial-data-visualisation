from __future__ import annotations

import argparse
import logging
import os
from typing import Tuple

import pandas as pd
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app.models import Base, Station, WeatherData


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DEFAULT_DB_URL = f"sqlite:///{os.path.join(BASE_DIR, 'bom_data.db')}"


def _resolve_database_url() -> str:
    database_url = os.getenv("DATABASE_URL", DEFAULT_DB_URL)
    if not database_url.startswith("sqlite"):
        raise RuntimeError("init_db.py currently supports only SQLite DATABASE_URL values")
    return database_url


def _database_has_data(session_factory) -> bool:
    with session_factory() as session:
        station_count = session.query(Station).count()
        weather_count = session.query(WeatherData).count()
        return station_count > 0 and weather_count > 0


def _prepare_engine(database_url: str):
    engine = create_engine(database_url, echo=False, future=True)
    url = engine.url
    if url.database:
        os.makedirs(os.path.dirname(url.database), exist_ok=True)
    return engine


def init_database(force: bool = False) -> Tuple[int, int]:
    database_url = _resolve_database_url()
    engine = _prepare_engine(database_url)
    Session = sessionmaker(bind=engine, autoflush=False, future=True)

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    has_tables = {"stations", "weather_data"}.issubset(tables)

    if not force and has_tables and _database_has_data(Session):
        logger.info("Existing weather data detected - skipping reinitialisation")
        return 0, 0

    logger.info("Creating BOM database at %s", database_url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    session = Session()

    logger.info("Loading stations from Parquet...")
    stations_df = pd.read_parquet(os.path.join(DATA_DIR, "bomstationsdb.parquet"))

    station_map = {}
    for _, row in stations_df.iterrows():
        station = Station(
            state=row["State"],
            station_name=row["Station Name"],
            latitude=row["Latitude"],
            longitude=row["Longitude"],
        )
        session.add(station)
        session.flush()
        station_map[(row["State"], row["Station Name"])] = station.id

    session.commit()
    station_count = len(station_map)
    logger.info("Inserted %s stations", station_count)

    logger.info("Loading weather data from Parquet...")
    weather_df = pd.read_parquet(os.path.join(DATA_DIR, "bomweatherdata.parquet"))
    weather_df["Date"] = pd.to_datetime(weather_df["Date"], format="%d/%m/%Y")

    weather_records = []
    for _, row in weather_df.iterrows():
        station_id = station_map.get((row["State"], row["Station Name"]))
        if not station_id:
            continue
        weather_records.append(
            {
                "station_id": station_id,
                "date": row["Date"],
                "evapotranspiration_mm": row.get("Evapo-Transpiration (mm)"),
                "rainfall_mm": row.get("Rain (mm)"),
                "temp_max_c": row.get("Maximum Temperature (C)"),
                "temp_min_c": row.get("Minimum Temperature (C)"),
                "humidity_max_percent": row.get("Maximum Relative Humidity (%)"),
                "humidity_min_percent": row.get("Minimum Relative Humidity (%)"),
                "wind_speed_ms": row.get("Average 10m Wind Speed (m/s)"),
            }
        )

    session.bulk_insert_mappings(WeatherData, weather_records)
    session.commit()
    weather_count = len(weather_records)
    logger.info("Inserted %s weather records", weather_count)

    session.close()
    logger.info("Database initialization complete!")
    return station_count, weather_count


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Initialise the BOM weather SQLite database")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Rebuild the database even if existing data is detected",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    init_database(force=args.force)
