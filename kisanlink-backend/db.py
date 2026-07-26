import os
import psycopg2
from urllib.parse import urlparse
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# 1. Get the database URL from Render (or fallback to your local settings)
DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "postgresql://kisanlink_user:password123@localhost:5432/kisanlink_db"
)

# 2. Fix the prefix for SQLAlchemy compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


# 3. Your connection function safely broken down into components
def get_db_connection():
    try:
        # Automatically parses the connection string into host, user, password, etc.
        params = urlparse(DATABASE_URL)
        
        conn = psycopg2.connect(
            host=params.hostname,
            database=params.path[1:], # Removes the leading slash from the database name
            user=params.username,
            password=params.password,
            port=params.port or 5432
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None