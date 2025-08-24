import ftplib
import pandas as pd
from io import BytesIO
import socket
import logging
from app import cache

logger = logging.getLogger(__name__)

BOM_FTP_HOST = 'ftp.bom.gov.au'
FTP_BASE_PATH = '/anon/gen/clim_data/IDCKWCDEA0/tables/'
socket.setdefaulttimeout(30)


def _get_ftp_connection():
    """Helper function to get a logged-in FTP connection."""
    ftp = ftplib.FTP(BOM_FTP_HOST)
    ftp.login()
    return ftp


@cache.memoize(timeout=3600)
def get_locations_for_state(state):
    ftp = None
    try:
        ftp = _get_ftp_connection()
        path = f"{FTP_BASE_PATH}{state}/"
        ftp.cwd(path)
        locations = ftp.nlst()
        logger.info(f"Discovered and cached {len(locations)} locations for state: {state}")
        return locations
    finally:
        if ftp:
            ftp.quit()


@cache.memoize(timeout=900)
def get_weather_data(state, location, year, month):
    """
    Downloads, parses, and cleans BOM weather data synchronously.
    The result is cached to improve performance on subsequent calls.
    """
    ftp = None
    try:
        month_str = str(month).zfill(2)
        filename = f"{location}-{year}{month_str}.csv"
        path = f"{FTP_BASE_PATH}{state}/{location}/"
        
        logger.info(f"Navigating to FTP path: {path} to download {filename}")

        ftp = _get_ftp_connection()
        ftp.cwd(path)
        
        in_memory_file = BytesIO()
        ftp.retrbinary(f"RETR {filename}", in_memory_file.write)
        in_memory_file.seek(0)

        df = pd.read_csv(
            in_memory_file,
            encoding='iso-8859-1',
            skiprows=9,
            header=[0, 1, 2]
        )
        
        cleaned_columns = []
        for col in df.columns:
            clean_name = '_'.join([str(c) for c in col if 'Unnamed' not in str(c)]).strip()
            cleaned_columns.append(clean_name)
        df.columns = cleaned_columns

        df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y', errors='coerce')
        df.dropna(subset=['Date'], inplace=True)
        
        numeric_cols = [col for col in df.columns if col not in ['Station Name', 'Date']]
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        column_mapping = {
            'Station Name': 'station_name',
            'Date': 'date',
            'Evapo-_Transpiration_0000-2400': 'evapotranspiration_mm',
            'Rain_0900-0900': 'rainfall_mm',
            'Pan_Evaporation_0900-0900': 'pan_evaporation_mm',
            'Maximum_Temperature': 'temp_max_c',
            'Minimum_Temperature': 'temp_min_c',
            'Maximum_Relative_Humidity': 'humidity_max_percent',
            'Minimum_Relative_Humidity': 'humidity_min_percent',
            'Average_10m Wind_Speed': 'wind_speed_ms',
            'Solar_Radiation': 'solar_radiation_mj_sqm'
        }
        df.rename(columns=column_mapping, inplace=True)
        
        final_columns = [col for col in column_mapping.values() if col in df.columns]
        df = df[final_columns]
        
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')

        logger.info(f"Successfully transformed data for {location}")
        return df.to_dict(orient='records')

    except Exception as e:
        logger.error(f"An unexpected error occurred for {location} ({year}-{month}): {e}")
        return None
    finally:
        if ftp:
            ftp.quit()