# models_user.py - ADD THESE FIELDS
from extensions import db
from datetime import datetime, timedelta
import secrets

class User(db.Model):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    
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
    
    is_email_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100), unique=True)
    verification_token_expiry = db.Column(db.DateTime)

    # NEW: matches what admin.py and consumer.py already expect
    is_active = db.Column(db.Boolean, default=True)
    deactivation_reason = db.Column(db.Text)
    deactivated_at = db.Column(db.DateTime)
    deactivation_type = db.Column(db.String(20))
    deactivated_by = db.Column(db.Integer)
    reactivated_at = db.Column(db.DateTime)
    reactivation_reason = db.Column(db.Text)
    email_verified_at = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def generate_verification_token(self, expires_hours=24):
        """Generate a secure verification token"""
        self.verification_token = secrets.token_urlsafe(32)
        self.verification_token_expiry = datetime.utcnow() + timedelta(hours=expires_hours)
        return self.verification_token