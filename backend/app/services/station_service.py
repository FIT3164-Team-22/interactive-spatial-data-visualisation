from app.services.database_service import get_db_session
from app.models import Station
from sqlalchemy import func

def get_all_stations(state=None):
    with get_db_session() as session:
        query = session.query(Station)
        if state:
            query = query.filter(Station.state == state.upper())
        stations = query.all()
        return [{
            'id': s.id,
            'state': s.state,
            'station_name': s.station_name,
            'latitude': s.latitude,
            'longitude': s.longitude
        } for s in stations]

def get_station_by_id(station_id):
    with get_db_session() as session:
        station = session.query(Station).filter(Station.id == station_id).first()
        if station:
            return {
                'id': station.id,
                'state': station.state,
                'station_name': station.station_name,
                'latitude': station.latitude,
                'longitude': station.longitude
            }
        return None

def get_states():
    with get_db_session() as session:
        states = session.query(Station.state).distinct().order_by(Station.state).all()
        return [s[0] for s in states]
