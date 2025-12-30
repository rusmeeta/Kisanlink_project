from flask import Blueprint, request, jsonify, session
from extensions import db
from models_user import User
from models_message import Message

messages_bp = Blueprint("messages", __name__)

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

# Send a message
@messages_bp.route("/<int:other_id>", methods=["POST"])
def send_message(other_id):
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]
    data = request.get_json()
    text = data.get("message")

    if not text:
        return jsonify({"status": "error", "message": "Message empty"}), 400

    msg = Message(sender_id=user_id, receiver_id=other_id, message=text)
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

# List all conversations for FARMER (with consumers)
@messages_bp.route("/farmer-conversations", methods=["GET"])
def get_farmer_conversations():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]

    all_messages = Message.query.filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()

    conversations_dict = {}
    for msg in all_messages:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        if other_id not in conversations_dict:
            consumer = User.query.filter_by(id=other_id).first()
            if consumer and consumer.user_type == "consumer":
                conversations_dict[other_id] = {
                    "consumer_id": consumer.id,
                    "consumer_name": consumer.fullname,
                    "consumer_email": consumer.email,
                    "last_message": msg.message,
                    "last_msg_time": msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
                }

    conversations = list(conversations_dict.values())
    conversations.sort(key=lambda x: x["last_msg_time"], reverse=True)

    return jsonify({"status": "success", "conversations": conversations})

# List all conversations for CONSUMER
@messages_bp.route("/conversations", methods=["GET"])
def get_consumer_conversations():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    user_id = session["user_id"]

    all_messages = Message.query.filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()

    conversations_dict = {}
    for msg in all_messages:
        other_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        other_user = User.query.filter_by(id=other_id).first()
        if other_user and other_user.user_type == "farmer":
            # Only show farmer in consumer's list
            if other_id not in conversations_dict:
                conversations_dict[other_id] = {
                    "farmer_id": other_user.id,
                    "farmer_name": other_user.fullname,
                    "farmer_email": other_user.email,
                    "last_message": msg.message,
                    "last_msg_time": msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
                }

    conversations = list(conversations_dict.values())
    conversations.sort(key=lambda x: x["last_msg_time"], reverse=True)

    return jsonify({"status": "success", "conversations": conversations})

