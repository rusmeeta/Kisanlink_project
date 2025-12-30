# routes/messages.py - UPDATED WITH FARMER CONVERSATIONS
from flask import Blueprint, request, jsonify, session
from extensions import db
from datetime import datetime
from models_user import User  # Make sure this import is correct

messages_bp = Blueprint("messages", __name__)

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, nullable=False)
    receiver_id = db.Column(db.Integer, nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Get messages between logged-in user and another user
@messages_bp.route("/<int:other_id>", methods=["GET"])
def get_messages(other_id):
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]

    msgs = Message.query.filter(
        ((Message.sender_id == user_id) & (Message.receiver_id == other_id)) |
        ((Message.sender_id == other_id) & (Message.receiver_id == user_id))
    ).order_by(Message.created_at.asc()).all()

    return jsonify({
        "status": "success",
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "receiver_id": m.receiver_id,
                "message": m.message,
                "created_at": m.created_at.strftime("%Y-%m-%d %H:%M:%S")
            } for m in msgs
        ]
    })

# Send a message to another user
@messages_bp.route("/<int:other_id>", methods=["POST"])
def send_message(other_id):
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]
    data = request.get_json()
    text = data.get("message")

    if not text:
        return jsonify({"status": "error", "message": "Message empty"}), 400

    msg = Message(
        sender_id=user_id,
        receiver_id=other_id,
        message=text
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify({
        "status": "success",
        "data": {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "message": msg.message,
            "created_at": msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    })

# List all conversations for CONSUMER (with farmers)
@messages_bp.route("/conversations", methods=["GET"])
def get_conversations():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]
    
    try:
        # Get all messages where user is sender or receiver
        all_messages = Message.query.filter(
            (Message.sender_id == user_id) | (Message.receiver_id == user_id)
        ).order_by(Message.created_at.desc()).all()
        
        # Create a dictionary to store latest message per farmer
        conversations_dict = {}
        
        for msg in all_messages:
            # Determine who the other person is
            if msg.sender_id == user_id:
                other_id = msg.receiver_id
            else:
                other_id = msg.sender_id
            
            # Only add if not already in dict (to get the latest message)
            if other_id not in conversations_dict:
                # Get farmer details
                farmer = User.query.filter_by(id=other_id).first()
                
                if farmer and farmer.user_type == 'farmer':  # Only show farmers
                    conversations_dict[other_id] = {
                        "farmer_id": farmer.id,
                        "farmer_name": farmer.fullname,
                        "last_message": msg.message,
                        "last_msg_time": msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    }
        
        # Convert dict to list and sort by time
        conversations = list(conversations_dict.values())
        conversations.sort(key=lambda x: x["last_msg_time"], reverse=True)
        
        return jsonify({
            "status": "success", 
            "conversations": conversations,
            "debug": f"Found {len(conversations)} conversations"
        })
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_conversations: {error_details}")
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

# NEW: List all conversations for FARMER (with consumers)
@messages_bp.route("/farmer-conversations", methods=["GET"])
def get_farmer_conversations():
    """Get all conversations for farmer (with consumers)"""
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]
    
    try:
        # Get all messages where farmer is sender or receiver
        all_messages = Message.query.filter(
            (Message.sender_id == user_id) | (Message.receiver_id == user_id)
        ).order_by(Message.created_at.desc()).all()
        
        # Create a dictionary to store latest message per consumer
        conversations_dict = {}
        
        for msg in all_messages:
            # Determine who the other person is
            if msg.sender_id == user_id:
                other_id = msg.receiver_id
            else:
                other_id = msg.sender_id
            
            # Only add if not already in dict (to get the latest message)
            if other_id not in conversations_dict:
                # Get consumer details
                consumer = User.query.filter_by(id=other_id).first()
                
                if consumer and consumer.user_type == 'consumer':  # Only show consumers
                    conversations_dict[other_id] = {
                        "consumer_id": consumer.id,
                        "consumer_name": consumer.fullname,
                        "consumer_email": consumer.email,
                        "last_message": msg.message,
                        "last_msg_time": msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
                    }
        
        # Convert dict to list and sort by time
        conversations = list(conversations_dict.values())
        conversations.sort(key=lambda x: x["last_msg_time"], reverse=True)
        
        return jsonify({
            "status": "success", 
            "conversations": conversations,
            "count": len(conversations)
        })
        
    except Exception as e:
        print(f"Error in get_farmer_conversations: {str(e)}")
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

# Test endpoints
@messages_bp.route("/test", methods=["GET"])
def test_endpoint():
    return jsonify({
        "status": "success", 
        "message": "Messages endpoint is working",
        "session_user": session.get("user_id", "No user in session")
    })

@messages_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "messages"})