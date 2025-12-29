from flask import Blueprint, request, jsonify
from models_consumer import Order, OrderItem, Notification, Interaction
from db import db

order_bp = Blueprint("order", __name__)

@order_bp.route("/create", methods=["POST"])
def create_order():
    data = request.json

    # Create order
    order = Order(
        consumer_id=data["consumer_id"],
        farmer_id=data["farmer_id"]
    )
    db.session.add(order)
    db.session.commit()

    # Order items
    for item in data["items"]:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item["product_id"],
            quantity=item["quantity"]
        )
        db.session.add(order_item)

    # Farmer notification
    farmer_notification = Notification(
        user_id=data["farmer_id"],
        order_id=order.id,
        message="New order received from consumer."
    )

    # Consumer notification
    consumer_notification = Notification(
        user_id=data["consumer_id"],
        order_id=order.id,
        message="Your order has been placed successfully."
    )

    db.session.add(farmer_notification)
    db.session.add(consumer_notification)

    # Create chat interaction
    chat_message = Interaction(
        sender_id=data["consumer_id"],
        receiver_id=data["farmer_id"],
        message="Order placed. Please confirm availability."
    )
    db.session.add(chat_message)

    db.session.commit()

    return jsonify({
        "message": "Order placed successfully",
        "order_id": order.id
    })
