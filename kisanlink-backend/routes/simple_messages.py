# routes/simple_messages.py
from flask import Blueprint, request, jsonify
from extensions import db
from models_message import Message
from models_user import User

simple_bp = Blueprint("simple", __name__)

# 1. Send message (ANY user to ANY user)
@simple_bp.route("/send", methods=["POST"])
def send_simple_message():
    data = request.get_json()
    
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    message = data.get("message")
    
    if not all([sender_id, receiver_id, message]):
        return jsonify({"error": "Missing data"}), 400
    
    # Create message
    new_msg = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message
    )
    
    db.session.add(new_msg)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": {
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "receiver_id": new_msg.receiver_id,
            "message": new_msg.message,
            "created_at": new_msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    })

# 2. Get messages between two users (BOTH can see)
@simple_bp.route("/between/<int:user1_id>/<int:user2_id>", methods=["GET"])
def get_messages_between(user1_id, user2_id):
    messages = Message.query.filter(
        ((Message.sender_id == user1_id) & (Message.receiver_id == user2_id)) |
        ((Message.sender_id == user2_id) & (Message.receiver_id == user1_id))
    ).order_by(Message.created_at.asc()).all()
    
    return jsonify({
        "success": True,
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "receiver_id": m.receiver_id,
                "message": m.message,
                "created_at": m.created_at.strftime("%Y-%m-%d %H:%M:%S")
            } for m in messages
        ]
    })

# 3. Get all conversations for a user
@simple_bp.route("/conversations/<int:user_id>", methods=["GET"])
def get_user_conversations(user_id):
    # Get all unique users this user has chatted with
    query = db.session.query(
        Message.sender_id,
        Message.receiver_id
    ).filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).distinct()
    
    conversations = []
    for sender, receiver in query:
        other_id = receiver if sender == user_id else sender
        
        # Get latest message
        latest_msg = Message.query.filter(
            ((Message.sender_id == user_id) & (Message.receiver_id == other_id)) |
            ((Message.sender_id == other_id) & (Message.receiver_id == user_id))
        ).order_by(Message.created_at.desc()).first()
        
        # Get other user info
        other_user = User.query.get(other_id)
        
        conversations.append({
            "other_user_id": other_id,
            "other_user_name": other_user.fullname if other_user else f"User {other_id}",
            "last_message": latest_msg.message if latest_msg else "",
            "last_time": latest_msg.created_at.strftime("%Y-%m-%d %H:%M:%S") if latest_msg else ""
        })
    
    return jsonify({
        "success": True,
        "conversations": conversations
    })