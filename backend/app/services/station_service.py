from __future__ import annotations

from typing import Dict, List, Optional

from app.repositories import StationRepository
from app.services.database_service import get_db_session
from app.utils.logging import get_logger

logger = get_logger(__name__)


def get_all_stations(state: Optional[str] = None) -> List[Dict[str, object]]:
    with get_db_session() as session:
        repository = StationRepository(session)
        stations = repository.list_stations(state)
        logger.debug("Fetched %s stations", len(stations))
        return [
            {
                "id": station.id,
                "state": station.state,
                "station_name": station.station_name,
                "latitude": station.latitude,
                "longitude": station.longitude,
            }
            for station in stations
        ]


def get_station_by_id(station_id: int) -> Optional[Dict[str, object]]:
    with get_db_session() as session:
        repository = StationRepository(session)
        station = repository.get_by_id(station_id)
        if station is None:
            logger.info("Station not found", extra={"station_id": station_id})
            return None
        return {
            "id": station.id,
            "state": station.state,
            "station_name": station.station_name,
            "latitude": station.latitude,
            "longitude": station.longitude,
        }


def get_states() -> List[str]:
    with get_db_session() as session:
        repository = StationRepository(session)
        states = repository.list_states()
        logger.debug("Fetched %s states", len(states))
        return states
