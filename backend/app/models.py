from __future__ import annotations

from datetime import date
from typing import List, Optional

from sqlalchemy import Date, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base declarative class for SQLAlchemy models."""


class Station(Base):
    """Weather station metadata."""

    __tablename__ = "stations"
    __table_args__ = (
        Index("ix_station_state", "state"),
        Index("ix_station_name", "station_name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    state: Mapped[str] = mapped_column(String(10), nullable=False)
    station_name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    weather_data: Mapped[List["WeatherData"]] = relationship(
        back_populates="station",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class WeatherData(Base):
    """Daily weather observations for a station."""

    __tablename__ = "weather_data"
    __table_args__ = (
        Index("ix_weather_station_date", "station_id", "date"),
        UniqueConstraint("station_id", "date", name="uq_weather_station_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    station_id: Mapped[int] = mapped_column(
        ForeignKey("stations.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    evapotranspiration_mm: Mapped[Optional[float]] = mapped_column(Float)
    rainfall_mm: Mapped[Optional[float]] = mapped_column(Float)
    temp_max_c: Mapped[Optional[float]] = mapped_column(Float)
    temp_min_c: Mapped[Optional[float]] = mapped_column(Float)
    humidity_max_percent: Mapped[Optional[float]] = mapped_column(Float)
    humidity_min_percent: Mapped[Optional[float]] = mapped_column(Float)
    wind_speed_ms: Mapped[Optional[float]] = mapped_column(Float)

    station: Mapped[Station] = relationship(back_populates="weather_data")
