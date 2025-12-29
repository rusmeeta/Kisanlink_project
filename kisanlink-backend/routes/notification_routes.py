from flask import Blueprint, jsonify
from models_consumer import Notification, Order
from db import db

notification_bp = Blueprint("notification", __name__)

@notification_bp.route("/notifications/<int:notification_id>/chat-target", methods=["GET"])
def get_chat_target(notification_id):
    result = (
        db.session.query(Order.farmer_id)
        .join(Notification, Notification.order_id == Order.id)
        .filter(Notification.id == notification_id)
        .first()
    )

    if not result:
        return jsonify({"message": "Not found"}), 404

    return jsonify({
        "farmerId": result.farmer_id
    })
