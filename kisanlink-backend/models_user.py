# models_user.py - UPDATED
from extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(100), nullable=False)  # NOT username!
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(100))
    user_type = db.Column(db.String(20), nullable=False)  # 'farmer' or 'consumer'
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    login_count = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime)
    
    # Remove or fix any username references
    # If you have this line, remove it:
    # username = db.Column(db.String(80), unique=True, nullable=False)
    
    def __repr__(self):
        return f'<User {self.email}>'