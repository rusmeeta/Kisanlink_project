from extensions import db

class CartItem(db.Model):
    __tablename__ = "cart_items"  # <-- note the single `=` and no stray underscores
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)
    consumer_id = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, default=1)
