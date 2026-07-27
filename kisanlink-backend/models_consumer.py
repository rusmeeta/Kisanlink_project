from extensions import db
from datetime import datetime

class Consumer(db.Model):
    __tablename__ = "consumers"

    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(200))
    email = db.Column(db.String(200), unique=True)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    login_count = db.Column(db.Integer, default=0)


class ConsumerPurchaseHistory(db.Model):
    __tablename__ = "consumer_purchase_history"

    id = db.Column(db.Integer, primary_key=True)
    consumer_id = db.Column(db.Integer)
    product_id = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)









