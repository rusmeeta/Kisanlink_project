# notifications.py - COMPLETE VERSION WITH READ ENDPOINT
from flask import Blueprint, jsonify, session
from extensions import db
from models_notification import Notification
from models_order import Order
from models_user import User

notifications_bp = Blueprint("notifications", __name__)

@notifications_bp.route("/", methods=["GET"])
@notifications_bp.route("", methods=["GET"])
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

# CRITICAL: This endpoint was missing!
@notifications_bp.route("/<int:notification_id>/read", methods=["POST"])
def mark_notification_as_read(notification_id):
    """Mark a notification as read for the current user"""
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    try:
        user_id = session["user_id"]
        
        # Find notification for this user
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id
        ).first()
        
        if not notification:
            print(f"❌ Notification {notification_id} not found for user {user_id}")
            return jsonify({"status": "error", "message": "Notification not found"}), 404
        
        print(f"📝 Marking notification {notification_id} as read for user {user_id}")
        print(f"   Current is_read: {notification.is_read}")
        
        # Mark as read
        notification.is_read = True
        db.session.commit()
        
        print(f"✅ Successfully marked notification {notification_id} as read")
        
        return jsonify({
            "status": "success", 
            "message": "Notification marked as read",
            "notification_id": notification_id
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error marking notification {notification_id} as read: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Optional: Mark all notifications as read
@notifications_bp.route("/mark-all-read", methods=["POST"])
def mark_all_notifications_as_read():
    """Mark all notifications as read for the current user"""
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    try:
        user_id = session["user_id"]
        
        # Find all unread notifications for this user
        notifications = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).all()
        
        count = len(notifications)
        
        # Mark all as read
        for notification in notifications:
            notification.is_read = True
        
        db.session.commit()
        
        print(f"✅ Marked {count} notifications as read for user {user_id}")
        
        return jsonify({
            "status": "success", 
            "message": f"Marked {count} notifications as read",
            "count": count
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error marking all notifications as read: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
# Add this endpoint to your notifications.py file
@notifications_bp.route("/unread-count", methods=["GET"])
def get_unread_count():
    """Get count of unread notifications for current user"""
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    try:
        user_id = session["user_id"]
        
        # Count unread notifications
        unread_count = Notification.query.filter_by(
            user_id=user_id,
            is_read=False
        ).count()
        
        print(f"📊 Unread notifications for user {user_id}: {unread_count}")
        
        return jsonify({
            "status": "success",
            "success": True,  # Add this for compatibility
            "count": unread_count
        })
        
    except Exception as e:
        print(f"❌ Error counting unread notifications: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500