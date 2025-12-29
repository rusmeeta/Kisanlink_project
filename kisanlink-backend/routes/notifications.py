from flask import Blueprint, jsonify, session
from extensions import db
from models_notification import Notification
from models_order import Order  # make sure this is your Order model

notifications_bp = Blueprint("notifications", __name__)

# -----------------------------
# GET notifications for logged-in user
# -----------------------------
@notifications_bp.route("/", methods=["GET"])
def get_notifications():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()

    data = []
    for n in notifications:
        # Default farmer_id to None
        farmer_id = None

        # If order_id exists, get farmer_id from the order
        if n.order_id:
            order = Order.query.get(n.order_id)
            if order:
                farmer_id = order.farmer_id

        data.append({
            "id": n.id,
            "order_id": getattr(n, "order_id", None),
            "message": n.message,
            "target_role": getattr(n, "target_role", None),
            "farmer_id": farmer_id,   # <-- added
            "is_read": getattr(n, "is_read", False),
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S") if getattr(n, "created_at", None) else None
        })

    return jsonify({"status": "success", "notifications": data})

# -----------------------------
# MARK a notification as read
# -----------------------------
@notifications_bp.route("/<int:notification_id>/read", methods=["POST"])
def mark_as_read(notification_id):
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]
    notification = Notification.query.get(notification_id)
    if not notification or notification.user_id != user_id:
        return jsonify({"status": "error", "message": "Notification not found"}), 404

    notification.is_read = True
    db.session.commit()
    return jsonify({"status": "success", "message": "Notification marked as read"})
