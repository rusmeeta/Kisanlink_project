# notifications.py - FINAL FIXED VERSION
from flask import Blueprint, jsonify, session
from extensions import db
from models_notification import Notification
from models_order import Order
from models_user import User

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/", methods=["GET"])
def get_notifications():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]
    user_type = session.get("user_type", "")
    
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()

    data = []
    for n in notifications:
        # Get user info first (current user)
        current_user = User.query.get(user_id)
        current_user_type = current_user.user_type if current_user else user_type
        
        # Default values
        farmer_id = None
        consumer_id = None
        other_user_id = None
        other_user_name = None
        order_details = None
        
        # Get order details if exists
        if n.order_id:
            order = Order.query.get(n.order_id)
            if order:
                farmer_id = order.farmer_id
                consumer_id = order.consumer_id
                
                # CRITICAL: Determine who to chat with
                if current_user_type == "consumer":
                    # Consumer wants to chat with farmer
                    other_user_id = farmer_id
                    other_user = User.query.get(farmer_id)
                elif current_user_type == "farmer":
                    # Farmer wants to chat with consumer
                    other_user_id = consumer_id
                    other_user = User.query.get(consumer_id)
                
                # Get other user's name
                if other_user:
                    other_user_name = other_user.fullname
                elif other_user_id:
                    other_user_name = f"User {other_user_id}"
                
                # Add order context
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
            # User IDs for chat
            "farmer_id": farmer_id,
            "consumer_id": consumer_id,
            # FOR CHAT NAVIGATION - Most important!
            "chat_with_id": other_user_id,      # ID of user to chat with
            "chat_with_name": other_user_name,  # Name to display
            "current_user_type": current_user_type,  # 'consumer' or 'farmer'
            "order_details": order_details,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            # Add notification type for easier handling
            "notification_type": "order_chat" if n.order_id else "general"
        })

    return jsonify({
        "status": "success", 
        "notifications": data,
        "current_user_type": user_type
    })