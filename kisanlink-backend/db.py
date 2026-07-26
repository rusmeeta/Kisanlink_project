import os
import psycopg2
from extensions import db
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

# Re-export db so existing imports still work
# But we want everyone to use extensions.db instead

def get_db_connection():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("⚠️ DATABASE_URL not set, returning None")
        return None
    return psycopg2.connect(database_url)

# Optional: create engine if needed
engine = create_engine(os.getenv('DATABASE_URL')) if os.getenv('DATABASE_URL') else None
db_session = scoped_session(sessionmaker(bind=engine)) if engine else None