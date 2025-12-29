from flask import Blueprint, request, jsonify
from models_order import Order, OrderItem
from models_notification import Notification
from extensions import db

order_bp = Blueprint("order", __name__)

# ----------------- Create Order -----------------
@order_bp.route("/create", methods=["POST"])
def create_order():
    data = request.json

    # 1️⃣ Create the order
    order = Order(consumer_id=data["consumer_id"], farmer_id=data["farmer_id"])
    db.session.add(order)
    db.session.flush()  # get order.id without commit

    # 2️⃣ Add order items
    for item in data["items"]:
        order_item = OrderItem(order_id=order.id, product_id=item["product_id"], quantity=item["quantity"])
        db.session.add(order_item)

    # 3️⃣ Add notifications
    farmer_notification = Notification(
        user_id=data["farmer_id"],
        order_id=order.id,
        message=f"New order received from consumer {data['consumer_id']} ({', '.join([str(i['quantity'])+' kg' for i in data['items']])})",
        target_role="farmer"
    )
    db.session.add(farmer_notification)

    consumer_notification = Notification(
        user_id=data["consumer_id"],
        order_id=order.id,
        message=f"Your order of {', '.join([str(i['quantity'])+' kg' for i in data['items']])} has been placed successfully.",
        target_role="consumer"
    )
    db.session.add(consumer_notification)

    db.session.commit()  # commit everything at once

    return jsonify({"message": "Order placed", "order_id": order.id})


# ----------------- Get farmer_id by order -----------------
@order_bp.route("/<int:order_id>", methods=["GET"])
def get_order_farmer(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"status": "error", "message": "Order not found"}), 404

    return jsonify({"status": "success", "farmer_id": order.farmer_id})
