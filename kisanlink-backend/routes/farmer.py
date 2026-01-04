import os
from flask import Blueprint, request, jsonify, send_from_directory, session
from werkzeug.utils import secure_filename
from db import get_db_connection
from datetime import datetime, timedelta

# Create a Flask blueprint for farmer-related routes
farmer_bp = Blueprint("farmer", __name__)

# Directory where uploaded product images will be stored
UPLOAD_FOLDER = "uploads"
# Allowed file extensions for uploaded images
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

# Create the uploads folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Mapping human-readable location names to latitude/longitude
location_coords = {
    "Naya Thimi": (27.6943, 85.3347),
    "Gatthaghar": (27.6739136, 85.3739132),
    "Kausaltar": (27.6745787, 85.3642978),
    "Lokanthali": (27.6740, 85.3450),
}

# Helper function to check if uploaded file has allowed extension
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to calculate time ago
def get_time_ago(date_string):
    if not date_string:
        return "Just now"
    
    try:
        date = datetime.strptime(date_string, "%Y-%m-%d %H:%M:%S")
        now = datetime.now()
        diff = now - date
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds // 3600 > 0:
            return f"{diff.seconds // 3600}h ago"
        elif diff.seconds // 60 > 0:
            return f"{diff.seconds // 60}m ago"
        else:
            return "Just now"
    except:
        return ""

# Serve uploaded images from the server
@farmer_bp.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ==================== DASHBOARD ENDPOINTS ====================

# ------------------ Farmer Info ------------------
@farmer_bp.route("/me", methods=["GET"])
def get_farmer_info():
    """
    Get the currently logged-in farmer's details
    """
    try:
        farmer_id = session.get("user_id")  # Get user ID from session
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        # Fetch farmer details from users table
        cur.execute("""
            SELECT id, fullname, email, location, latitude, longitude, user_type, last_login
            FROM users
            WHERE id=%s
        """, (farmer_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"error": "Farmer not found"}), 404

        # Convert row to dict
        farmer = {
            "id": row[0],
            "fullname": row[1],
            "email": row[2],
            "location": row[3],
            "latitude": row[4],
            "longitude": row[5],
            "user_type": row[6],
            "last_login": row[7].strftime("%Y-%m-%d %H:%M:%S") if row[7] else None
        }

        return jsonify(farmer), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Get Complete Dashboard Stats ------------------
@farmer_bp.route("/stats", methods=["GET"])
def get_farmer_stats():
    """
    Get complete stats for farmer dashboard
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        
        # 1. Total products count
        cur.execute("SELECT COUNT(*) FROM farmer_items WHERE farmer_id=%s", (farmer_id,))
        total_products = cur.fetchone()[0]
        
        # 2. Total orders count
        cur.execute("SELECT COUNT(*) FROM orders WHERE farmer_id=%s", (farmer_id,))
        total_orders = cur.fetchone()[0]
        
        # 3. Total revenue (sum of all orders)
        cur.execute("SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE farmer_id=%s", (farmer_id,))
        total_revenue = float(cur.fetchone()[0])
        
        # 4. Unique customers count
        cur.execute("""
            SELECT COUNT(DISTINCT consumer_id) 
            FROM orders 
            WHERE farmer_id=%s
        """, (farmer_id,))
        unique_customers = cur.fetchone()[0]
        
        # 5. Pending orders count
        cur.execute("SELECT COUNT(*) FROM orders WHERE farmer_id=%s AND status='pending'", (farmer_id,))
        pending_orders = cur.fetchone()[0]
        
        # 6. Today's orders
        today = datetime.now().strftime("%Y-%m-%d")
        cur.execute("""
            SELECT COUNT(*) 
            FROM orders 
            WHERE farmer_id=%s AND DATE(order_date)=%s
        """, (farmer_id, today))
        today_orders = cur.fetchone()[0]
        
        # 7. Average order value
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
        
        # 8. Completion rate (completed orders / total orders)
        cur.execute("SELECT COUNT(*) FROM orders WHERE farmer_id=%s AND status='completed'", (farmer_id,))
        completed_orders = cur.fetchone()[0]
        completion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
        
        cur.close()
        conn.close()
        
        stats = {
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "unique_customers": unique_customers,
            "pending_orders": pending_orders,
            "today_orders": today_orders,
            "avg_order_value": round(avg_order_value, 2),
            "completion_rate": round(completion_rate, 1),
            "pending_notifications": 0  # Will be set from notifications endpoint
        }
        
        return jsonify({"status": "success", "stats": stats}), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Get Recent Orders ------------------
@farmer_bp.route("/orders/recent", methods=["GET"])
def get_recent_orders():
    """
    Get recent orders for dashboard
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get last 10 orders
        cur.execute("""
            SELECT o.id, o.consumer_id, o.item_id, o.quantity, o.total_price, 
                   o.status, o.order_date, u.fullname as consumer_name,
                   fi.item_name as product_name
            FROM orders o
            LEFT JOIN users u ON o.consumer_id = u.id
            LEFT JOIN farmer_items fi ON o.item_id = fi.id
            WHERE o.farmer_id=%s
            ORDER BY o.order_date DESC
            LIMIT 10
        """, (farmer_id,))
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        orders = []
        for row in rows:
            orders.append({
                "id": row[0],
                "consumer_id": row[1],
                "item_id": row[2],
                "quantity": row[3],
                "total_price": float(row[4]) if row[4] else 0,
                "status": row[5],
                "order_date": row[6].strftime("%Y-%m-%d %H:%M:%S") if row[6] else None,
                "consumer_name": row[7] or f"Customer {row[1]}",
                "product_name": row[8] or f"Product {row[2]}",
                "time_ago": get_time_ago(row[6].strftime("%Y-%m-%d %H:%M:%S") if row[6] else "")
            })
        
        return jsonify({"status": "success", "orders": orders, "count": len(orders)}), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Get Orders Count ------------------
@farmer_bp.route("/orders/count", methods=["GET"])
def get_orders_count():
    """
    Get total orders count for farmer
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM orders WHERE farmer_id=%s", (farmer_id,))
        count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return jsonify({"status": "success", "count": count}), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Get Unique Customers Count ------------------
@farmer_bp.route("/orders/customers", methods=["GET"])
def get_unique_customers():
    """
    Get unique customers count for farmer
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT COUNT(DISTINCT consumer_id) 
            FROM orders 
            WHERE farmer_id=%s
        """, (farmer_id,))
        count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return jsonify({"status": "success", "count": count}), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Get Dashboard Summary ------------------
@farmer_bp.route("/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    """
    Get complete dashboard summary in one call
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get farmer info
        cur.execute("""
            SELECT id, fullname, email, location, user_type
            FROM users
            WHERE id=%s
        """, (farmer_id,))
        farmer_row = cur.fetchone()
        
        if not farmer_row:
            return jsonify({"error": "Farmer not found"}), 404
        
        farmer_info = {
            "id": farmer_row[0],
            "fullname": farmer_row[1],
            "email": farmer_row[2],
            "location": farmer_row[3],
            "user_type": farmer_row[4]
        }
        
        # Get stats
        cur.execute("SELECT COUNT(*) FROM farmer_items WHERE farmer_id=%s", (farmer_id,))
        total_products = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM orders WHERE farmer_id=%s", (farmer_id,))
        total_orders = cur.fetchone()[0]
        
        cur.execute("""
            SELECT COUNT(DISTINCT consumer_id) 
            FROM orders 
            WHERE farmer_id=%s
        """, (farmer_id,))
        unique_customers = cur.fetchone()[0]
        
        # Get recent orders (5)
        cur.execute("""
            SELECT o.id, o.consumer_id, o.quantity, o.total_price, 
                   o.status, o.order_date, u.fullname as consumer_name
            FROM orders o
            LEFT JOIN users u ON o.consumer_id = u.id
            WHERE o.farmer_id=%s
            ORDER BY o.order_date DESC
            LIMIT 5
        """, (farmer_id,))
        
        order_rows = cur.fetchall()
        recent_orders = []
        for row in order_rows:
            recent_orders.append({
                "id": row[0],
                "consumer_id": row[1],
                "quantity": row[2],
                "total_price": float(row[3]) if row[3] else 0,
                "status": row[4],
                "order_date": row[5].strftime("%Y-%m-%d %H:%M:%S") if row[5] else None,
                "consumer_name": row[6] or f"Customer {row[1]}"
            })
        
        cur.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "farmer": farmer_info,
            "stats": {
                "total_products": total_products,
                "total_orders": total_orders,
                "unique_customers": unique_customers
            },
            "recent_orders": recent_orders
        }), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ==================== PRODUCT ENDPOINTS ====================

# ------------------ Add Product ------------------
@farmer_bp.route("/add-product", methods=["POST"])
def add_product():
    """
    Add a new product for the logged-in farmer
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        # Get product data from form-data
        item_name = request.form.get("item_name")
        price = float(request.form.get("price"))
        location = request.form.get("location")
        min_order_qty = int(request.form.get("min_order_qty"))
        available_stock = int(request.form.get("available_stock"))
        photo = request.files.get("photo")

        # Validate all fields
        if not all([item_name, price, location, min_order_qty, available_stock, photo]):
            return jsonify({"error": "All fields including photo are required"}), 400

        # Validate file type
        if not allowed_file(photo.filename):
            return jsonify({"error": "Invalid file type"}), 400

        # Secure filename and save photo
        filename = secure_filename(photo.filename)
        photo.save(os.path.join(UPLOAD_FOLDER, filename))

        # Get coordinates from location
        latitude, longitude = location_coords.get(location, (None, None))

        # Insert product into database
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO farmer_items
            (farmer_id, item_name, price, photo_path, location, min_order_qty, available_stock, latitude, longitude)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (farmer_id, item_name, price, filename, location, min_order_qty, available_stock, latitude, longitude))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Product added successfully"}), 201

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Get Products ------------------
@farmer_bp.route("/products", methods=["GET"])
def get_products():
    """
    Get all products for the logged-in farmer
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, item_name, price, photo_path, location, min_order_qty, available_stock,status, latitude, longitude
            FROM farmer_items
            WHERE farmer_id=%s
        """, (farmer_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        # Convert rows to list of dicts
        products = [
            {
                "id": r[0],
                "item_name": r[1],
                "price": r[2],
                "photo_path": r[3],
                "location": r[4],
                "min_order_qty": r[5],
                "available_stock": r[6],
                "status":r[7],
                "latitude": r[8],
                "longitude": r[9]
            } for r in rows
        ]

        return jsonify({"products": products}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------ Update Product ------------------
@farmer_bp.route("/update-product/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    """
    Update a product for the logged-in farmer
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        # Fetch product to check ownership
        cur.execute("SELECT farmer_id, photo_path FROM farmer_items WHERE id=%s", (product_id,))
        product = cur.fetchone()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        if product[0] != farmer_id:
            return jsonify({"error": "Unauthorized"}), 403

        # Get updated fields
        item_name = request.form.get("item_name")
        price = float(request.form.get("price"))
        location = request.form.get("location")
        min_order_qty = int(request.form.get("min_order_qty"))
        available_stock = int(request.form.get("available_stock"))

        old_photo = product[1]
        photo = request.files.get("photo")
        # Save new photo if uploaded, else keep old
        if photo and allowed_file(photo.filename):
            filename = secure_filename(photo.filename)
            photo.save(os.path.join(UPLOAD_FOLDER, filename))
            photo_to_save = filename
        else:
            photo_to_save = old_photo

        latitude, longitude = location_coords.get(location, (None, None))

        # Update product in database
        cur.execute("""
            UPDATE farmer_items
            SET item_name=%s, price=%s, location=%s, min_order_qty=%s, available_stock=%s, photo_path=%s, latitude=%s, longitude=%s
            WHERE id=%s
        """, (item_name, price, location, min_order_qty, available_stock, photo_to_save, latitude, longitude, product_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Product updated successfully"}), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

# ------------------ Delete Product ------------------
@farmer_bp.route("/delete-product/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """
    Delete a product for the logged-in farmer
    """
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401

        conn = get_db_connection()
        cur = conn.cursor()
        # Check ownership
        cur.execute("SELECT farmer_id FROM farmer_items WHERE id=%s", (product_id,))
        product = cur.fetchone()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        if product[0] != farmer_id:
            return jsonify({"error": "Unauthorized"}), 403

        # Delete product
        cur.execute("DELETE FROM farmer_items WHERE id=%s", (product_id,))
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Product deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== TEST ENDPOINTS ====================

@farmer_bp.route("/test", methods=["GET"])
def test_endpoint():
    """Test endpoint to verify farmer routes are working"""
    try:
        farmer_id = session.get("user_id")
        if not farmer_id:
            return jsonify({"error": "Not logged in"}), 401
            
        return jsonify({
            "status": "success",
            "message": "Farmer endpoints are working",
            "farmer_id": farmer_id,
            "endpoints": [
                "/farmer/me",
                "/farmer/stats",
                "/farmer/products",
                "/farmer/orders/recent",
                "/farmer/dashboard/summary"
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@farmer_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "farmer"})