from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from contextlib import contextmanager
import os

DB_PATH = os.getenv('DATABASE_URL', 'sqlite:///bom_data.db')

engine = create_engine(DB_PATH, pool_pre_ping=True, pool_recycle=3600)
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

@contextmanager
def get_db_session():
    session = Session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def get_session():
    return Session()
