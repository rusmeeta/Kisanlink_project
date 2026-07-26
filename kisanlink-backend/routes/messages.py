from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models_user import User
from models_message import Message
from datetime import datetime
from sqlalchemy import text

messages_bp = Blueprint("messages", __name__)

# Helper function to get user info
def get_user_info(user_id):
    user = User.query.get(user_id)
    if user:
        return {
            "id": user.id,
            "fullname": user.fullname,
            "email": user.email,
            "user_type": user.user_type,
            "location": user.location
        }
    return None

# Get messages between logged-in user and another user
@messages_bp.route("/<int:other_id>", methods=["GET"])
@jwt_required()
def get_messages(other_id):
    user_id = int(get_jwt_identity())

    msgs = Message.query.filter(
        ((Message.sender_id == user_id) & (Message.receiver_id == other_id)) |
        ((Message.sender_id == other_id) & (Message.receiver_id == user_id))
    ).order_by(Message.created_at.asc()).all()

    current_user_info = get_user_info(user_id)
    other_user_info = get_user_info(other_id)

    messages_with_names = []
    for m in msgs:
        sender_info = get_user_info(m.sender_id)
        receiver_info = get_user_info(m.receiver_id)
        messages_with_names.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": sender_info["fullname"] if sender_info else f"User {m.sender_id}",
            "sender_email": sender_info["email"] if sender_info else "",
            "receiver_id": m.receiver_id,
            "receiver_name": receiver_info["fullname"] if receiver_info else f"User {m.receiver_id}",
            "receiver_email": receiver_info["email"] if receiver_info else "",
            "message": m.message,
            "created_at": m.created_at.isoformat()
        })

    return jsonify({
        "status": "success",
        "current_user": current_user_info,
        "other_user": other_user_info,
        "messages": messages_with_names
    })

# Send a message
@messages_bp.route("/<int:other_id>", methods=["POST"])
@jwt_required()
def send_message(other_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    text = data.get("message")

    if not text:
        return jsonify({"status": "error", "message": "Message empty"}), 400

    msg = Message(sender_id=user_id, receiver_id=other_id, message=text)
    db.session.add(msg)
    db.session.commit()

    sender_info = get_user_info(user_id)
    receiver_info = get_user_info(other_id)

    return jsonify({
        "status": "success",
        "message": {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender_info["fullname"] if sender_info else f"User {msg.sender_id}",
            "sender_email": sender_info["email"] if sender_info else "",
            "receiver_id": msg.receiver_id,
            "receiver_name": receiver_info["fullname"] if receiver_info else f"User {msg.receiver_id}",
            "receiver_email": receiver_info["email"] if receiver_info else "",
            "message": msg.message,
            "created_at": msg.created_at.isoformat(),
        }
    })

# List all conversations for FARMER (with consumers)
@messages_bp.route("/farmer-conversations", methods=["GET"])
@jwt_required()
def get_farmer_conversations():
    user_id = int(get_jwt_identity())
    
    farmer_info = get_user_info(user_id)
    
    query = text("""
        SELECT DISTINCT ON (other_id) 
            other_id,
            message,
            created_at,
            sender_id,
            receiver_id
        FROM (
            SELECT 
                CASE 
                    WHEN sender_id = :user_id THEN receiver_id 
                    ELSE sender_id 
                END as other_id,
                message,
                created_at,
                sender_id,
                receiver_id
            FROM messages
            WHERE sender_id = :user_id OR receiver_id = :user_id
            ORDER BY created_at DESC
        ) as subquery
        ORDER BY other_id, created_at DESC
    """)
    
    result = db.session.execute(query, {"user_id": user_id})
    rows = result.fetchall()
    
    conversations = []
    for row in rows:
        other_id = row[0]
        consumer = User.query.filter_by(id=other_id, user_type="consumer").first()
        
        if consumer:
            unread_count = Message.query.filter(
                Message.sender_id == other_id,
                Message.receiver_id == user_id,
                Message.is_seen == False
            ).count()
            
            conversations.append({
                "consumer_id": consumer.id,
                "consumer_name": consumer.fullname,
                "consumer_email": consumer.email,
                "consumer_location": consumer.location,
                "last_message": row[1],
                "last_msg_time": row[2].isoformat() if row[2] else None,
                "last_message_from_farmer": row[3] == user_id,
                "unread_count": unread_count,
                "total_messages": Message.query.filter(
                    ((Message.sender_id == user_id) & (Message.receiver_id == other_id)) |
                    ((Message.sender_id == other_id) & (Message.receiver_id == user_id))
                ).count()
            })
    
    conversations.sort(key=lambda x: x["last_msg_time"], reverse=True)
    
    return jsonify({
        "status": "success", 
        "farmer": farmer_info,
        "conversations": conversations,
        "count": len(conversations)
    })

# List all conversations for CONSUMER (with farmers)
@messages_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_consumer_conversations():
    user_id = int(get_jwt_identity())
    
    consumer_info = get_user_info(user_id)
    
    query = text("""
        SELECT DISTINCT ON (other_id) 
            other_id,
            message,
            created_at,
            sender_id,
            receiver_id
        FROM (
            SELECT 
                CASE 
                    WHEN sender_id = :user_id THEN receiver_id 
                    ELSE sender_id 
                END as other_id,
                message,
                created_at,
                sender_id,
                receiver_id
            FROM messages
            WHERE sender_id = :user_id OR receiver_id = :user_id
            ORDER BY created_at DESC
        ) as subquery
        ORDER BY other_id, created_at DESC
    """)
    
    result = db.session.execute(query, {"user_id": user_id})
    rows = result.fetchall()
    
    conversations = []
    for row in rows:
        other_id = row[0]
        farmer = User.query.filter_by(id=other_id, user_type="farmer").first()
        
        if farmer:
            unread_count = Message.query.filter(
                Message.sender_id == other_id,
                Message.receiver_id == user_id,
                Message.is_seen == False
            ).count()
            
            conversations.append({
                "farmer_id": farmer.id,
                "farmer_name": farmer.fullname,
                "farmer_email": farmer.email,
                "farmer_location": farmer.location,
                "last_message": row[1],
                "last_msg_time": row[2].isoformat() if row[2] else None,
                "last_message_from_consumer": row[3] == user_id,
                "unread_count": unread_count,
                "total_messages": Message.query.filter(
                    ((Message.sender_id == user_id) & (Message.receiver_id == other_id)) |
                    ((Message.sender_id == other_id) & (Message.receiver_id == user_id))
                ).count()
            })
    
    conversations.sort(key=lambda x: x["last_msg_time"], reverse=True)
    
    return jsonify({
        "status": "success",
        "consumer": consumer_info,
        "conversations": conversations,
        "count": len(conversations)
    })

# Mark messages as seen
@messages_bp.route("/mark-seen/<int:sender_id>", methods=["POST"])
@jwt_required()
def mark_messages_seen(sender_id):
    user_id = int(get_jwt_identity())
    
    Message.query.filter(
        Message.sender_id == sender_id,
        Message.receiver_id == user_id,
        Message.is_seen == False
    ).update({"is_seen": True})
    
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": "Messages marked as seen"
    })

# Get unread message count
@messages_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def get_unread_count():
    user_id = int(get_jwt_identity())
    
    unread_count = Message.query.filter(
        Message.receiver_id == user_id,
        Message.is_seen == False
    ).count()
    
    return jsonify({
        "status": "success",
        "unread_count": unread_count
    })

# Test endpoint
@messages_bp.route("/test", methods=["GET"])
@jwt_required()
def test_endpoint():
    user_id = get_jwt_identity()
    return jsonify({
        "status": "success", 
        "message": "Messages endpoint is working with JWT",
        "user_id": user_id
    })

# Health check (public)
@messages_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "messages"})