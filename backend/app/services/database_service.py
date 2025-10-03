from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///bom_data.db")

engine = create_engine(
    DB_PATH,
    pool_pre_ping=True,
    pool_recycle=3600,
    future=True,
)
SessionLocal = scoped_session(
    sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
)


@contextmanager
def get_db_session() -> Generator:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_session():
    return SessionLocal()


__all__ = ["engine", "get_db_session", "get_session"]
