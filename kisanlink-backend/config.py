import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey")
    
    # 1. Grab the database URL from Render's environment variables
    db_uri = os.environ.get("DATABASE_URL")
    
    if db_uri:
        # 2. Fix the prefix rule for SQLAlchemy 1.4+ compatibility
        if db_uri.startswith("postgres://"):
            db_uri = db_uri.replace("postgres://", "postgres://", 1).replace("postgres://", "postgresql://", 1)
    else:
        # 3. Fallback path for your local machine
        db_uri = "postgresql://kisanlink_user:password123@localhost:5432/kisanlink_db"
        
    SQLALCHEMY_DATABASE_URI = db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
