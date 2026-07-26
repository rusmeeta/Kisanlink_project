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


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    consumer_id = db.Column(db.Integer)
    product_id = db.Column(db.Integer)
    quantity = db.Column(db.Integer)


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    consumer_id = db.Column(db.Integer)
    farmer_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default="pending")


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer)
    product_id = db.Column(db.Integer)
    quantity = db.Column(db.Integer)


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer)
    receiver_id = db.Column(db.Integer)
    content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer)
    message = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    seen = db.Column(db.Boolean, default=False)
