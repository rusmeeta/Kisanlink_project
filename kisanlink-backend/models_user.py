# models_user.py - ADD THESE FIELDS
from extensions import db
from datetime import datetime, timedelta
import secrets

class User(db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(100))
    user_type = db.Column(db.String(20), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    login_count = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime)
    
    # ✅ ADD THESE 3 LINES for email verification
    is_email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), unique=True)
    verification_token_expiry = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    # ✅ ADD THIS METHOD to generate verification token
    def generate_verification_token(self, expires_hours=24):
        """Generate a secure verification token"""
        self.verification_token = secrets.token_urlsafe(32)
        self.verification_token_expiry = datetime.utcnow() + timedelta(hours=expires_hours)
        return self.verification_token