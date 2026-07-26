from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity  # optional
from db import get_db_connection

products_bp = Blueprint("products_bp", __name__)

@products_bp.route("/farmer-items", methods=["GET"])
@jwt_required(optional=True)  # allows both authenticated and anonymous requests
def get_farmer_items():
    # If you want to use the logged-in user (optional)
    current_user = get_jwt_identity()  # will be None if no token

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT fi.id, fi.farmer_id, fi.item_name, fi.price, fi.photo_path, fi.location,
               fi.min_order_qty, fi.available_stock, fi.status, fi.is_approved, 
               fi.has_pending_edit, fi.edit_status,
               u.fullname AS farmer_name, u.latitude AS farmer_lat, u.longitude AS farmer_lon,
               u.is_active as farmer_active, u.is_email_verified as farmer_verified
        FROM farmer_items fi
        JOIN users u ON u.id = fi.farmer_id
        WHERE 
            u.is_active = TRUE
            AND u.is_email_verified = TRUE
            AND fi.status = 'approved'
            AND fi.is_approved = TRUE
            AND fi.available_stock > 0
            AND (fi.has_pending_edit = FALSE OR fi.has_pending_edit IS NULL)
            AND (fi.edit_status IS NULL OR fi.edit_status NOT IN ('edit_pending', 'pending_approval'))
        ORDER BY fi.created_at DESC
    """)
    
    rows = cur.fetchall()
    cur.close()
    conn.close()

    items = []
    for row in rows:
        items.append({
            "id": row[0],
            "farmer_id": row[1],
            "item_name": row[2],
            "price": row[3],
            "photo_path": row[4],
            "location": row[5],
            "min_order_qty": row[6],
            "available_stock": row[7],
            "status": row[8],
            "is_approved": row[9],
            "has_pending_edit": row[10],
            "edit_status": row[11],
            "farmer_name": row[12],
            "farmer_lat": row[13],
            "farmer_lon": row[14],
            "farmer_active": row[15],
            "farmer_verified": row[16]
        })
    
    return jsonify(items)