from extensions import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    message = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=True)  # must match DB column
    target_id = db.Column(db.Integer, nullable=True)
    target_role = db.Column(db.String, nullable=True)
    is_read = db.Column(db.Boolean, default=False)
