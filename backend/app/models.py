from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Station(Base):
    __tablename__ = 'stations'

    id = Column(Integer, primary_key=True)
    state = Column(String(10), nullable=False, index=True)
    station_name = Column(String(255), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    weather_data = relationship('WeatherData', back_populates='station', cascade='all, delete-orphan')

class WeatherData(Base):
    __tablename__ = 'weather_data'

    id = Column(Integer, primary_key=True)
    station_id = Column(Integer, ForeignKey('stations.id'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    evapotranspiration_mm = Column(Float)
    rainfall_mm = Column(Float)
    temp_max_c = Column(Float)
    temp_min_c = Column(Float)
    humidity_max_percent = Column(Float)
    humidity_min_percent = Column(Float)
    wind_speed_ms = Column(Float)

    station = relationship('Station', back_populates='weather_data')
