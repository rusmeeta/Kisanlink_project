from flask import Blueprint, request, jsonify, session
from extensions import db
from utils.distance import haversine
from models_user import User
from models_message import Message
from models_farmer_items import FarmerItem
from models_order import Order
from sqlalchemy import or_, and_, text

consumer_bp = Blueprint("consumer", __name__)

# -----------------------------
# NEARBY PRODUCTS - WITH DEBUG INFO
# -----------------------------
@consumer_bp.route('/nearby-products', methods=['GET'])
def nearby_products():
    """Get nearby products - STRICTER VERSION"""
    try:
        consumer_lat = float(request.args.get("lat"))
        consumer_lon = float(request.args.get("lon"))
    except:
        return jsonify({"error": "Invalid coordinates"}), 400

    # STRICTER QUERY - Add these filters
    query = text("""
        SELECT fi.*, u.fullname AS farmer_name, u.latitude AS farmer_lat, u.longitude AS farmer_lon,
               u.is_active as farmer_active, u.is_email_verified as farmer_verified,
               u.deactivation_reason, u.deactivated_at  -- Add these for debugging
        FROM farmer_items fi
        JOIN users u ON fi.farmer_id = u.id
        WHERE u.user_type = 'farmer'
        AND u.is_active = TRUE  -- MUST BE ACTIVE
        AND u.is_email_verified = TRUE
        AND fi.status = 'approved'
        AND fi.is_approved = TRUE
        AND fi.available_stock > 0
        AND (fi.has_pending_edit = FALSE OR fi.has_pending_edit IS NULL)  -- NO PENDING EDITS
        AND (fi.edit_status IS NULL OR fi.edit_status != 'edit_pending')  -- NO EDIT PENDING STATUS
    """)
    
    result = db.session.execute(query)
    
    items = []
    blocked_items = []  # For debugging
    
    for row in result:
        # Check ALL conditions again in Python
        farmer_active = row.farmer_active
        farmer_verified = row.farmer_verified
        product_status = row.status
        is_approved = row.is_approved
        has_pending_edit = row.has_pending_edit
        
        # If ANY condition fails, block this product
        if not all([farmer_active, farmer_verified, 
                   product_status == 'approved', is_approved,
                   not has_pending_edit]):
            blocked_items.append({
                "product_id": row.id,
                "product_name": row.item_name,
                "farmer_id": row.farmer_id,
                "farmer_name": row.farmer_name,
                "reason": {
                    "farmer_active": farmer_active,
                    "farmer_verified": farmer_verified,
                    "product_status": product_status,
                    "is_approved": is_approved,
                    "has_pending_edit": has_pending_edit
                }
            })
            continue  # Skip this product
        
        # Only add if ALL conditions pass
        distance_km = haversine(consumer_lat, consumer_lon, row.farmer_lat, row.farmer_lon)
        
        items.append({
            "id": row.id,
            "item_name": row.item_name,
            "price": float(row.price) if row.price else 0,
            "photo_path": row.photo_path,
            "location": row.location,
            "min_order_qty": row.min_order_qty,
            "available_stock": row.available_stock,
            "farmer_name": row.farmer_name,
            "farmer_id": row.farmer_id,
            "farmer_active": row.farmer_active,
            "farmer_verified": row.farmer_verified,
            "distance": round(distance_km, 2),
            "status": row.status,
            "is_approved": row.is_approved,
            "has_pending_edit": row.has_pending_edit,
            "edit_status": row.edit_status
        })
    
    # Debug: List all deactivated farmers
    deactivated_farmers_query = text("""
        SELECT id, fullname, is_active, deactivation_reason, deactivated_at
        FROM users 
        WHERE user_type = 'farmer' AND is_active = FALSE
    """)
    deactivated_result = db.session.execute(deactivated_farmers_query)
    deactivated_farmers = [
        {
            "id": row.id,
            "name": row.fullname,
            "reason": row.deactivation_reason,
            "deactivated_at": row.deactivated_at.strftime("%Y-%m-%d") if row.deactivated_at else None
        }
        for row in deactivated_result
    ]
    
    return jsonify({
        "products": items,
        "count": len(items),
        "debug": {
            "blocked_products": blocked_items,
            "deactivated_farmers_blocked": deactivated_farmers,
            "message": f"Showing {len(items)} approved products from ACTIVE farmers only"
        }
    })
# -----------------------------
# GET ALL FARMERS - STRICT FILTER
# -----------------------------
@consumer_bp.route('/farmers', methods=['GET'])
def get_all_farmers():
    """Get list of all active farmers with approved products - STRICT"""
    try:
        # Only show active and verified farmers
        farmers = User.query.filter_by(
            user_type='farmer',
            is_active=True,
            is_email_verified=True
        ).all()
        
        farmers_list = []
        blocked_farmers = []
        
        for farmer in farmers:
            # Get approved products count
            approved_products = FarmerItem.query.filter(
                FarmerItem.farmer_id == farmer.id,
                FarmerItem.status == 'approved',
                FarmerItem.is_approved == True,
                FarmerItem.available_stock > 0
            ).all()
            
            product_count = len(approved_products)
            
            if product_count > 0:
                low_stock_count = len([p for p in approved_products if p.available_stock <= 5])
                
                farmers_list.append({
                    "id": farmer.id,
                    "fullname": farmer.fullname,
                    "location": farmer.location,
                    "email": farmer.email,
                    "is_active": farmer.is_active,
                    "is_verified": farmer.is_email_verified,
                    "product_count": product_count,
                    "low_stock_count": low_stock_count,
                    "latitude": farmer.latitude,
                    "longitude": farmer.longitude
                })
            else:
                blocked_farmers.append({
                    "id": farmer.id,
                    "name": farmer.fullname,
                    "reason": "No approved products with stock"
                })
        
        return jsonify({
            "status": "success",
            "farmers": farmers_list,
            "count": len(farmers_list),
            "debug": {
                "blocked_farmers": blocked_farmers,
                "message": f"Showing {len(farmers_list)} active farmers with approved products"
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting farmers list: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# -----------------------------
# DEBUG ENDPOINT - CHECK ALL DATA
# -----------------------------
@consumer_bp.route('/debug-data', methods=['GET'])
def debug_data():
    """Debug endpoint to check all farmers and products"""
    try:
        # Get all farmers
        farmers = User.query.filter_by(user_type='farmer').all()
        
        farmer_data = []
        for farmer in farmers:
            products = FarmerItem.query.filter_by(farmer_id=farmer.id).all()
            
            approved_products = [p for p in products if p.status == 'approved' and p.is_approved]
            
            farmer_data.append({
                "id": farmer.id,
                "name": farmer.fullname,
                "email": farmer.email,
                "is_active": farmer.is_active,
                "is_email_verified": farmer.is_email_verified,
                "deactivation_reason": farmer.deactivation_reason,
                "deactivated_at": farmer.deactivated_at.strftime("%Y-%m-%d %H:%M") if farmer.deactivated_at else None,
                "total_products": len(products),
                "approved_products": len(approved_products),
                "products": [
                    {
                        "id": p.id,
                        "name": p.item_name,
                        "status": p.status,
                        "is_approved": p.is_approved,
                        "stock": p.available_stock,
                        "has_pending_edit": p.has_pending_edit
                    } for p in products
                ]
            })
        
        return jsonify({
            "status": "success",
            "total_farmers": len(farmer_data),
            "active_farmers": len([f for f in farmer_data if f["is_active"]]),
            "inactive_farmers": len([f for f in farmer_data if not f["is_active"]]),
            "farmers": farmer_data,
            "notes": [
                "Check if 'is_active' = false for deactivated farmers",
                "Check if 'status' != 'approved' for blocked products",
                "Check if 'is_approved' = false for unapproved products"
            ]
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# -----------------------------
# CLEAR CACHE ENDPOINT
# -----------------------------
@consumer_bp.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear any cached data on frontend"""
    return jsonify({
        "status": "success",
        "message": "Frontend cache should be cleared",
        "instructions": [
            "1. Clear browser cache (Ctrl+Shift+Delete)",
            "2. Hard reload page (Ctrl+F5)",
            "3. Log out and log back in",
            "4. Check /consumer/debug-data for current data"
        ]
    })

# -----------------------------
# CHECK SPECIFIC FARMER
# -----------------------------
@consumer_bp.route('/check-farmer/<int:farmer_id>', methods=['GET'])
def check_farmer(farmer_id):
    """Check specific farmer status"""
    farmer = User.query.get(farmer_id)
    
    if not farmer:
        return jsonify({"status": "error", "message": "Farmer not found"}), 404
    
    products = FarmerItem.query.filter_by(farmer_id=farmer_id).all()
    
    return jsonify({
        "farmer": {
            "id": farmer.id,
            "name": farmer.fullname,
            "is_active": farmer.is_active,
            "is_email_verified": farmer.is_email_verified,
            "deactivation_reason": farmer.deactivation_reason,
            "deactivated_at": farmer.deactivated_at.strftime("%Y-%m-%d %H:%M") if farmer.deactivated_at else None,
            "status": "ACTIVE" if farmer.is_active else "DEACTIVATED"
        },
        "products": [
            {
                "id": p.id,
                "name": p.item_name,
                "status": p.status,
                "is_approved": p.is_approved,
                "stock": p.available_stock,
                "available_to_consumers": p.status == 'approved' and p.is_approved and farmer.is_active and farmer.is_email_verified
            } for p in products
        ],
        "summary": {
            "total_products": len(products),
            "approved_products": len([p for p in products if p.status == 'approved' and p.is_approved]),
            "available_to_consumers": farmer.is_active and farmer.is_email_verified
        }
    })

# -----------------------------
# UPDATED TEST ENDPOINT
# -----------------------------
@consumer_bp.route('/test', methods=['GET'])
def test_consumer():
    """Test endpoint with debug info"""
    return jsonify({
        "status": "success",
        "message": "Consumer endpoints are working",
        "debug_endpoints": [
            "/consumer/debug-data - Check all farmer/product data",
            "/consumer/check-farmer/<id> - Check specific farmer",
            "/consumer/clear-cache - Clear frontend cache"
        ],
        "problem": "If seeing deactivated farmer products:",
        "solutions": [
            "1. Check /consumer/debug-data to verify farmer is_active status",
            "2. Clear browser cache (Ctrl+Shift+Delete)",
            "3. Hard reload (Ctrl+F5)",
            "4. Check frontend code - might be using cached data"
        ],
        "expected_farmers_active": [
            "Sarju Rana (55) - Active",
            "Prakriti Paudel (27) - Active", 
            "Rusmita Chaulagain (52) - Active",
            "Indira Chaulagain (54) - Active"
        ],
        "expected_farmers_blocked": [
            "Rudra (22) - INACTIVE",
            "Sarju Rana (37) - INACTIVE",
            "Milan (28) - INACTIVE"
        ]
    })

# Add this to your consumer_bp in consumer.py

# -----------------------------
# GET MESSAGES WITH FARMER - For Consumer
# -----------------------------
@consumer_bp.route('/messages/<int:farmer_id>', methods=['GET'])
def get_consumer_farmer_messages(farmer_id):
    """Get messages between consumer and specific farmer"""
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    consumer_id = session["user_id"]
    
    # Verify farmer exists
    farmer = User.query.get(farmer_id)
    if not farmer or farmer.user_type != 'farmer':
        return jsonify({"status": "error", "message": "Farmer not found"}), 404
    
    # Get messages between consumer and farmer
    messages = Message.query.filter(
        or_(
            and_(Message.sender_id == consumer_id, Message.receiver_id == farmer_id),
            and_(Message.sender_id == farmer_id, Message.receiver_id == consumer_id)
        )
    ).order_by(Message.timestamp.asc()).all()
    
    # Format messages
    messages_data = []
    for msg in messages:
        sender = User.query.get(msg.sender_id)
        messages_data.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "message": msg.content,
            "created_at": msg.timestamp.isoformat() if msg.timestamp else None,
            "file_url": msg.file_url,
            "file_name": msg.file_name,
            "file_type": msg.file_type,
            "sender_name": sender.fullname if sender else "Unknown"
        })
    
    return jsonify({
        "status": "success",
        "messages": messages_data,
        "other_user": {
            "id": farmer.id,
            "fullname": farmer.fullname,
            "email": farmer.email,
            "location": farmer.location,
            "user_type": farmer.user_type
        }
    })

# -----------------------------
# SEND MESSAGE TO FARMER - For Consumer
# -----------------------------
@consumer_bp.route('/messages/<int:farmer_id>/send', methods=['POST'])
def send_consumer_message(farmer_id):
    """Send message from consumer to farmer"""
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    consumer_id = session["user_id"]
    data = request.get_json()
    
    if not data or ("message" not in data and "file_url" not in data):
        return jsonify({"status": "error", "message": "Message or file is required"}), 400
    
    # Verify farmer exists
    farmer = User.query.get(farmer_id)
    if not farmer or farmer.user_type != 'farmer':
        return jsonify({"status": "error", "message": "Farmer not found"}), 404
    
    # Create message
    new_message = Message(
        sender_id=consumer_id,
        receiver_id=farmer_id,
        content=data.get("message", "").strip(),
        file_url=data.get("file_url"),
        file_name=data.get("file_name"),
        file_type=data.get("file_type")
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    # Get sender info
    sender = User.query.get(consumer_id)
    
    return jsonify({
        "status": "success",
        "message": {
            "id": new_message.id,
            "sender_id": new_message.sender_id,
            "receiver_id": new_message.receiver_id,
            "message": new_message.content,
            "created_at": new_message.timestamp.isoformat() if new_message.timestamp else None,
            "file_url": new_message.file_url,
            "file_name": new_message.file_name,
            "file_type": new_message.file_type,
            "sender_name": sender.fullname if sender else "Unknown"
        }
    })