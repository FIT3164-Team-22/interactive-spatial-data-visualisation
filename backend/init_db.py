import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Station, WeatherData
from datetime import datetime
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DB_PATH = f'sqlite:///{os.path.join(BASE_DIR, "bom_data.db")}'

def init_database():
    engine = create_engine(DB_PATH, echo=False)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    logger.info("Loading stations from Parquet...")
    stations_df = pd.read_parquet(os.path.join(DATA_DIR, 'bomstationsdb.parquet'))

    station_map = {}
    for _, row in stations_df.iterrows():
        station = Station(
            state=row['State'],
            station_name=row['Station Name'],
            latitude=row['Latitude'],
            longitude=row['Longitude']
        )
        session.add(station)
        session.flush()
        station_map[(row['State'], row['Station Name'])] = station.id

    session.commit()
    logger.info(f"Inserted {len(station_map)} stations")

    logger.info("Loading weather data from Parquet...")
    weather_df = pd.read_parquet(os.path.join(DATA_DIR, 'bomweatherdata.parquet'))
    weather_df['Date'] = pd.to_datetime(weather_df['Date'], format='%d/%m/%Y')

    weather_records = []
    for _, row in weather_df.iterrows():
        station_id = station_map.get((row['State'], row['Station Name']))
        if station_id:
            weather_records.append({
                'station_id': station_id,
                'date': row['Date'],
                'evapotranspiration_mm': row.get('Evapo-Transpiration (mm)'),
                'rainfall_mm': row.get('Rain (mm)'),
                'temp_max_c': row.get('Maximum Temperature (C)'),
                'temp_min_c': row.get('Minimum Temperature (C)'),
                'humidity_max_percent': row.get('Maximum Relative Humidity (%)'),
                'humidity_min_percent': row.get('Minimum Relative Humidity (%)'),
                'wind_speed_ms': row.get('Average 10m Wind Speed (m/s)')
            })

    session.bulk_insert_mappings(WeatherData, weather_records)
    session.commit()
    logger.info(f"Inserted {len(weather_records)} weather records")

    session.close()
    logger.info("Database initialization complete!")

if __name__ == '__main__':
    init_database()
