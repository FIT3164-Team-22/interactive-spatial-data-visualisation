# Architecture Overview

## Backend

- **Framework**: Flask application factory in `app/__init__.py`
- **Routing**: Blueprint registered under `/api/v1` with input validation, pagination, and consistent error handling
- **Data Access**: SQLAlchemy 2.0 repositories (`app/repositories`) to encapsulate queries and prevent N+1 issues
- **Models**: Declarative mappings in `app/models.py` with composite indexes for `(station_id, date)`
- **Services**: Thin service layer providing orchestration, logging, and DTO generation
- **Migrations**: Alembic (`backend/alembic`) with initial schema revision `0001_create_schema.py`
- **Docs**: Flasgger swagger UI available at `/docs`
- **Insights**: `/api/v1/weather/summary` provides aggregated stats and notable highs/lows for dashboards
- **Production**: Gunicorn (`gunicorn.conf.py`) behind Flask-Talisman, Compress, and request size limits

## Frontend

- **Stack**: React 18 + Vite 7 + TailwindCSS
- **State**: Context providers for filters and theme, React Query for async data
- **API Client**: Axios instance (`src/api/client.js`) pointing to `/api/v1`
- **UX**: Lazy-loaded map and chart components, improved accessibility, tooltips, and error boundaries
- **Testing**: Vitest + Testing Library (`npm run test -- --run`)
- **Build**: Production bundle served via Nginx (see `frontend/Dockerfile` and `nginx.conf`)

## DevOps

- **Containerisation**: Two-stage builds via `docker-compose.yml`
  - `backend`: Python 3.11 + Gunicorn
  - `frontend`: Node build stage + Nginx runtime
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`) running backend pytest and frontend lint/test/build

## Data Flow

1. Frontend requests data through Axios client
2. Flask routes validate input, delegate to service layer
3. Repositories execute optimised SQLAlchemy queries with eager loading
4. Responses return paginated JSON payloads consumed by React hooks

## Environment

Key environment files:

- `backend/.env.example`
- `frontend/.env.example`
- root `.env.example` for docker-compose orchestration

Secret values (e.g., `SECRET_KEY`) must be provided per deployment environment.
