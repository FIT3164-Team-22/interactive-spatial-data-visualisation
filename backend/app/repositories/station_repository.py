from __future__ import annotations

from typing import List, Optional, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Station


class StationRepository:
    """Data access layer for weather stations."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def list_states(self) -> List[str]:
        statement = select(Station.state).distinct().order_by(Station.state)
        return [row[0] for row in self._session.execute(statement).all()]

    def list_stations(self, state: Optional[str] = None) -> Sequence[Station]:
        statement = select(Station)
        if state:
            statement = statement.where(Station.state == state.upper())
        statement = statement.order_by(Station.state, Station.station_name)
        return self._session.scalars(statement).all()

    def get_by_id(self, station_id: int) -> Optional[Station]:
        statement = select(Station).where(Station.id == station_id)
        return self._session.scalar(statement)

    def exists(self, station_id: int) -> bool:
        return self.get_by_id(station_id) is not None
