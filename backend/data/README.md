# Data Directory

## Included Files

This directory contains the Parquet data files for the BOM weather visualization platform:

- `bomstationsdb.parquet` (15KB) - Station metadata for 377 weather stations
  - Columns: State, Station Name, Latitude, Longitude

- `bomweatherdata.parquet` (9MB) - Weather observations (918k+ records from 2019-2025)
  - Columns: State, Station Name, Date, Evapo-Transpiration, Rain, Temperature (Max/Min), Humidity (Max/Min), Wind Speed

## Total Size: ~9MB

These files are **committed to the repository** and will automatically be available when you clone/deploy.

## Usage

The `init_db.py` script reads these Parquet files and loads them into a SQLite database:

```bash
cd backend
python init_db.py
```

This creates `bom_data.db` with properly indexed tables for fast queries.

## Deployment

✅ Files are in the repo - no additional setup needed
✅ Railway/Vercel will have access during build
✅ Database auto-generates on first deployment
