import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'supersecretkey')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    if not SQLALCHEMY_DATABASE_URI:
        print("⚠️ WARNING: DATABASE_URL not set. Some features may not work.")