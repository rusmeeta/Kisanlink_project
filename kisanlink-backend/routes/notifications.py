# notifications.py – JWT version
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models_notification import Notification
from models_order import Order
from models_user import User

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    user_type = current_user.user_type
    
    notifications = Notification.query.filter_by(user_id=user_id)\
        .order_by(Notification.created_at.desc()).all()

    data = []
    for n in notifications:
        # Defaults
        farmer_id = None
        consumer_id = None
        other_user_id = None
        other_user_name = None
        order_details = None

        if n.order_id:
            order = Order.query.get(n.order_id)
            if order:
                farmer_id = order.farmer_id
                consumer_id = order.consumer_id

                if user_type == "consumer":
                    other_user_id = farmer_id
                else:  # farmer
                    other_user_id = consumer_id

                other_user = User.query.get(other_user_id) if other_user_id else None
                other_user_name = other_user.fullname if other_user else f"User {other_user_id}" if other_user_id else None

                order_details = {
                    "order_id": order.id,
                    "product": getattr(order, 'product_name', ''),
                    "quantity": getattr(order, 'quantity', 0)
                }

        data.append({
            "id": n.id,
            "order_id": n.order_id,
            "message": n.message,
            "target_role": n.target_role,
            "farmer_id": farmer_id,
            "consumer_id": consumer_id,
            "chat_with_id": other_user_id,
            "chat_with_name": other_user_name,
            "current_user_type": user_type,
            "order_details": order_details,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "notification_type": "order_chat" if n.order_id else "general"
        })

    return jsonify({
        "status": "success",
        "notifications": data,
        "current_user_type": user_type
    })


@notifications_bp.route("/<int:notification_id>/read", methods=["POST"])
@jwt_required()
def mark_notification_as_read(notification_id):
    user_id = int(get_jwt_identity())

    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()

    if not notification:
        return jsonify({"status": "error", "message": "Notification not found"}), 404

    notification.is_read = True
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Notification marked as read",
        "notification_id": notification_id
    })


@notifications_bp.route("/mark-all-read", methods=["POST"])
@jwt_required()
def mark_all_notifications_as_read():
    user_id = int(get_jwt_identity())

    notifications = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).all()

    count = len(notifications)
    for n in notifications:
        n.is_read = True
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": f"Marked {count} notifications as read",
        "count": count
    })


@notifications_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def get_unread_count():
    user_id = int(get_jwt_identity())

    unread_count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()

    return jsonify({
        "status": "success",
        "success": True,
        "count": unread_count
    })