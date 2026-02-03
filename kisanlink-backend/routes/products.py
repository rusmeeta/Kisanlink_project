from flask import Blueprint, jsonify
from db import get_db_connection

products_bp = Blueprint("products_bp", __name__)

@products_bp.route("/farmer-items", methods=["GET"])
def get_farmer_items():
    conn = get_db_connection()
    cur = conn.cursor()

    # JOIN farmer_items with users table with STRICT FILTERS
    cur.execute("""
        SELECT fi.id, fi.farmer_id, fi.item_name, fi.price, fi.photo_path, fi.location,
               fi.min_order_qty, fi.available_stock, fi.status, fi.is_approved, 
               fi.has_pending_edit, fi.edit_status,
               u.fullname AS farmer_name, u.latitude AS farmer_lat, u.longitude AS farmer_lon,
               u.is_active as farmer_active, u.is_email_verified as farmer_verified
        FROM farmer_items fi
        JOIN users u ON u.id = fi.farmer_id
        WHERE 
            -- Farmer must be ACTIVE
            u.is_active = TRUE
            -- Farmer must be VERIFIED  
            AND u.is_email_verified = TRUE
            -- Product must be APPROVED status
            AND fi.status = 'approved'
            -- Product must be APPROVED (double-check)
            AND fi.is_approved = TRUE
            -- Product must have stock
            AND fi.available_stock > 0
            -- No pending edit requests
            AND (fi.has_pending_edit = FALSE OR fi.has_pending_edit IS NULL)
            -- Not in edit pending status
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
            "status": row[8],           # Should be 'approved'
            "is_approved": row[9],      # Should be True
            "has_pending_edit": row[10], # Should be False
            "edit_status": row[11],     # Should be NULL or not 'edit_pending'
            "farmer_name": row[12],
            "farmer_lat": row[13],
            "farmer_lon": row[14],
            "farmer_active": row[15],   # Should be True
            "farmer_verified": row[16]  # Should be True
        })
    
    return jsonify(items)