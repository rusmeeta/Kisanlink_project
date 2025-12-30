# routes/chat.py - FIXED for grouped conversations
import os
from flask import Blueprint, request, jsonify, session, send_from_directory
from werkzeug.utils import secure_filename
from db import get_db_connection

chat_bp = Blueprint('chat', __name__, url_prefix='/messages')

# Configuration
UPLOAD_FOLDER = 'uploads/messages'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'xls', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Serve uploaded files
@chat_bp.route('/uploads/messages/<filename>')
def uploaded_message_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# File upload endpoint
@chat_bp.route('/upload', methods=['POST'])
def upload_file():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400
    
    file = request.files['file']
    receiver_id = request.form.get('receiver_id')
    message_text = request.form.get('message', '').strip()
    
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400
    
    if not receiver_id:
        return jsonify({"status": "error", "message": "Receiver ID required"}), 400
    
    if file and allowed_file(file.filename):
        # Create upload directory if it doesn't exist
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{user_id}_{receiver_id}_{os.urandom(4).hex()}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)
        
        # Save message with file info
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO messages 
            (sender_id, receiver_id, message, file_url, file_name, file_type, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING id, sender_id, receiver_id, message, file_url, file_name, file_type, created_at
        """, (user_id, receiver_id, message_text, f'/uploads/messages/{unique_filename}', filename, file.content_type))
        
        new_message = cur.fetchone()
        conn.commit()
        
        # Get sender name
        cur.execute("SELECT fullname FROM users WHERE id = %s", (user_id,))
        sender_name = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "data": {
                "id": new_message[0],
                "sender_id": new_message[1],
                "receiver_id": new_message[2],
                "message": new_message[3],
                "file_url": new_message[4],
                "file_name": new_message[5],
                "file_type": new_message[6],
                "created_at": new_message[7],
                "sender_name": sender_name
            }
        })
    
    return jsonify({"status": "error", "message": "File type not allowed"}), 400

# ================== FIXED: Get grouped conversations for farmer ==================
@chat_bp.route("/farmer-conversations", methods=["GET"])
def farmer_conversations():
    """Get all unique consumers who have chatted with the farmer"""
    farmer_id = session.get("user_id")
    if not farmer_id:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get all unique consumers that farmer has communicated with (both sent and received)
    cur.execute("""
        SELECT 
            other_user.id as consumer_id,
            other_user.fullname as consumer_name,
            other_user.email as consumer_email,
            latest_msg.message as last_message,
            latest_msg.created_at as last_msg_time,
            latest_msg.sender_id = %s as last_msg_from_farmer,
            unread_count.unread_messages
        FROM (
            -- Get all consumer IDs that farmer has messaged or been messaged by
            SELECT DISTINCT 
                CASE 
                    WHEN sender_id = %s THEN receiver_id 
                    ELSE sender_id 
                END as other_user_id
            FROM messages
            WHERE sender_id = %s OR receiver_id = %s
        ) user_conversations
        JOIN users other_user ON user_conversations.other_user_id = other_user.id
        -- Get latest message in each conversation
        LEFT JOIN LATERAL (
            SELECT message, created_at, sender_id
            FROM messages
            WHERE (sender_id = %s AND receiver_id = other_user.id)
               OR (sender_id = other_user.id AND receiver_id = %s)
            ORDER BY created_at DESC
            LIMIT 1
        ) latest_msg ON true
        -- Count unread messages from consumer to farmer
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as unread_messages
            FROM messages
            WHERE sender_id = other_user.id 
              AND receiver_id = %s
              AND created_at > (
                  SELECT COALESCE(MAX(created_at), '1970-01-01')
                  FROM messages
                  WHERE sender_id = %s AND receiver_id = other_user.id
              )
        ) unread_count ON true
        WHERE other_user.user_type = 'consumer'
        ORDER BY latest_msg.created_at DESC NULLS LAST
    """, (farmer_id, farmer_id, farmer_id, farmer_id, farmer_id, farmer_id, farmer_id, farmer_id))
    
    conversations = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify({
        "status": "success",
        "conversations": [
            {
                "consumer_id": conv[0],
                "consumer_name": conv[1],
                "consumer_email": conv[2],
                "last_message": conv[3],
                "last_msg_time": conv[4],
                "last_msg_from_farmer": conv[5],  # True if last message was from farmer
                "unread_count": conv[6] or 0
            } for conv in conversations
        ]
    })

# Get messages between farmer and specific consumer
@chat_bp.route("/consumer/<int:consumer_id>", methods=["GET"])
def get_farmer_consumer_messages(consumer_id):
    """Get all messages between farmer and a specific consumer"""
    farmer_id = session.get("user_id")
    if not farmer_id:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get messages between farmer and consumer
    cur.execute("""
        SELECT 
            m.id,
            m.sender_id,
            m.receiver_id,
            m.message,
            m.created_at,
            m.file_url,
            m.file_name,
            m.file_type,
            u.fullname as sender_name,
            u.user_type as sender_type
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = %s AND m.receiver_id = %s) 
           OR (m.sender_id = %s AND m.receiver_id = %s)
        ORDER BY m.created_at ASC
    """, (farmer_id, consumer_id, consumer_id, farmer_id))
    
    messages = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify({
        "status": "success",
        "messages": [
            {
                "id": msg[0],
                "sender_id": msg[1],
                "receiver_id": msg[2],
                "message": msg[3],
                "created_at": msg[4],
                "file_url": msg[5],
                "file_name": msg[6],
                "file_type": msg[7],
                "sender_name": msg[8],
                "sender_type": msg[9]
            } for msg in messages
        ]
    })

# Get recent messages for notifications
@chat_bp.route("/", methods=["GET"])
def get_recent_messages():
    """Get recent messages where farmer is receiver (for notifications)"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get recent messages where user is receiver (incoming messages)
    cur.execute("""
        SELECT 
            m.id,
            m.sender_id,
            m.receiver_id,
            m.message,
            m.created_at,
            m.file_url,
            m.file_name,
            m.file_type,
            u.fullname as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.receiver_id = %s
        ORDER BY m.created_at DESC
        LIMIT 20
    """, (user_id,))
    
    messages = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify({
        "messages": [
            {
                "id": msg[0],
                "sender_id": msg[1],
                "receiver_id": msg[2],
                "message": msg[3],
                "created_at": msg[4],
                "file_url": msg[5],
                "file_name": msg[6],
                "file_type": msg[7],
                "sender_name": msg[8]
            } for msg in messages
        ]
    })

# Send message from farmer to consumer
@chat_bp.route("/<int:receiver_id>", methods=["POST"])
def send_message(receiver_id):
    """Send a message from farmer to consumer"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    data = request.get_json()
    message_content = data.get("message", "").strip()
    file_url = data.get("file_url")
    file_name = data.get("file_name")
    file_type = data.get("file_type")
    
    if not message_content and not file_url:
        return jsonify({"status": "error", "message": "Message or file is required"}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Insert message with file info if available
    cur.execute("""
        INSERT INTO messages 
        (sender_id, receiver_id, message, file_url, file_name, file_type, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        RETURNING id, sender_id, receiver_id, message, file_url, file_name, file_type, created_at
    """, (user_id, receiver_id, message_content, file_url, file_name, file_type))
    
    new_message = cur.fetchone()
    conn.commit()
    
    # Get sender name
    cur.execute("SELECT fullname FROM users WHERE id = %s", (user_id,))
    sender_name = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    
    return jsonify({
        "status": "success",
        "message": {
            "id": new_message[0],
            "sender_id": new_message[1],
            "receiver_id": new_message[2],
            "message": new_message[3],
            "file_url": new_message[4],
            "file_name": new_message[5],
            "file_type": new_message[6],
            "created_at": new_message[7],
            "sender_name": sender_name
        }
    })

# Get messages between current user and another user (generic)
@chat_bp.route("/<int:other_id>", methods=["GET"])
def get_messages_between(other_id):
    """Get messages between current user and another user"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get messages between two users
    cur.execute("""
        SELECT 
            m.id,
            m.sender_id,
            m.receiver_id,
            m.message,
            m.created_at,
            m.file_url,
            m.file_name,
            m.file_type,
            u.fullname as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = %s AND m.receiver_id = %s) 
           OR (m.sender_id = %s AND m.receiver_id = %s)
        ORDER BY m.created_at ASC
    """, (user_id, other_id, other_id, user_id))
    
    messages = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify({
        "status": "success",
        "messages": [
            {
                "id": msg[0],
                "sender_id": msg[1],
                "receiver_id": msg[2],
                "message": msg[3],
                "created_at": msg[4],
                "file_url": msg[5],
                "file_name": msg[6],
                "file_type": msg[7],
                "sender_name": msg[8]
            } for msg in messages
        ]
    })

# Mark messages as read
@chat_bp.route("/mark-read/<int:sender_id>", methods=["POST"])
def mark_messages_read(sender_id):
    """Mark messages from a specific sender as read"""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"status": "error", "message": "Not authenticated"}), 401
    
    # Note: Your messages table doesn't have a 'read' column
    # You might need to add one or implement this differently
    # For now, this is a placeholder
    
    return jsonify({
        "status": "success",
        "message": "Messages marked as read"
    })