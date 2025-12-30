from flask import Blueprint, request, jsonify
from extensions import db
from utils.distance import haversine
from models_user import User
from models_message import Message

consumer_bp = Blueprint("consumer", __name__)

# -----------------------------
# NEARBY PRODUCTS
# -----------------------------
@consumer_bp.route('/nearby-products', methods=['GET'])
def nearby_products():
    # 1. Get consumer location from frontend
    try:
        consumer_lat = float(request.args.get("lat"))
        consumer_lon = float(request.args.get("lon"))
    except:
        return jsonify({"error": "Invalid coordinates"}), 400

    # 2. Fetch all farmer_items + farmer location
    query = """
        SELECT fi.*, u.fullname AS farmer_name, u.latitude AS farmer_lat, u.longitude AS farmer_lon
        FROM farmer_items fi
        JOIN users u ON fi.farmer_id = u.id
    """
    result = db.session.execute(query)

    # 3. Calculate distance for each product
    items = []
    for row in result:
        distance_km = haversine(consumer_lat, consumer_lon, row.farmer_lat, row.farmer_lon)
        items.append({
            "id": row.id,
            "item_name": row.item_name,
            "price": row.price,
            "photo_path": row.photo_path,
            "location": row.location,
            "min_order_qty": row.min_order_qty,
            "available_stock": row.available_stock,
            "farmer_name": row.farmer_name,
            "farmer_id": row.farmer_id,
            "distance": round(distance_km, 2)  # km
        })

    # 4. Sort by distance ascending
    items.sort(key=lambda x: x["distance"])
    return jsonify(items)

# -----------------------------
# GET FARMER DETAILS BY ID
# -----------------------------
@consumer_bp.route('/farmer-details/<int:farmer_id>', methods=['GET'])
def get_farmer_details(farmer_id):
    """
    Get detailed information about a farmer
    Used in consumer chat to show farmer name and details
    """
    try:
        # Get farmer from users table
        farmer = User.query.filter_by(id=farmer_id, user_type='farmer').first()
        
        if not farmer:
            return jsonify({
                "status": "error",
                "message": f"Farmer with ID {farmer_id} not found"
            }), 404
        
        # Get farmer's products count
        from models_farmer_items import FarmerItem
        product_count = FarmerItem.query.filter_by(farmer_id=farmer_id).count()
        
        # Get rating (if you have rating system)
        rating = 4.5  # Default or calculate from reviews
        
        return jsonify({
            "status": "success",
            "farmer": {
                "id": farmer.id,
                "fullname": farmer.fullname,
                "email": farmer.email,
                "location": farmer.location,
                "latitude": farmer.latitude,
                "longitude": farmer.longitude,
                "user_type": farmer.user_type,
                "product_count": product_count,
                "rating": rating,
                "joined_date": farmer.created_at.strftime("%Y-%m-%d") if hasattr(farmer, 'created_at') else "Unknown"
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting farmer details: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# -----------------------------
# GET CONSUMER PROFILE
# -----------------------------
@consumer_bp.route('/profile', methods=['GET'])
def get_consumer_profile():
    """
    Get current consumer profile info
    """
    from flask import session
    
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    user_id = session['user_id']
    
    try:
        consumer = User.query.get(user_id)
        
        if not consumer or consumer.user_type != 'consumer':
            return jsonify({"status": "error", "message": "Consumer not found"}), 404
        
        # Get consumer stats
        from models_order import Order
        total_orders = Order.query.filter_by(consumer_id=user_id).count()
        
        # Get total spent
        total_spent_result = db.session.execute(
            "SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE consumer_id = :user_id",
            {"user_id": user_id}
        ).fetchone()
        total_spent = float(total_spent_result[0]) if total_spent_result else 0
        
        return jsonify({
            "status": "success",
            "profile": {
                "id": consumer.id,
                "fullname": consumer.fullname,
                "email": consumer.email,
                "location": consumer.location,
                "latitude": consumer.latitude,
                "longitude": consumer.longitude,
                "user_type": consumer.user_type,
                "total_orders": total_orders,
                "total_spent": total_spent,
                "joined_date": consumer.created_at.strftime("%Y-%m-%d") if hasattr(consumer, 'created_at') else "Unknown"
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting consumer profile: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# -----------------------------
# GET ALL FARMERS (for consumer to browse)
# -----------------------------
@consumer_bp.route('/farmers', methods=['GET'])
def get_all_farmers():
    """
    Get list of all farmers with basic info
    """
    try:
        farmers = User.query.filter_by(user_type='farmer').all()
        
        farmers_list = []
        for farmer in farmers:
            # Get product count for each farmer
            from models_farmer_items import FarmerItem
            product_count = FarmerItem.query.filter_by(farmer_id=farmer.id).count()
            
            farmers_list.append({
                "id": farmer.id,
                "fullname": farmer.fullname,
                "location": farmer.location,
                "email": farmer.email,
                "product_count": product_count,
                "latitude": farmer.latitude,
                "longitude": farmer.longitude
            })
        
        return jsonify({
            "status": "success",
            "farmers": farmers_list,
            "count": len(farmers_list)
        }), 200
        
    except Exception as e:
        print(f"Error getting farmers list: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# -----------------------------
# GET FARMER PRODUCTS
# -----------------------------
@consumer_bp.route('/farmer/<int:farmer_id>/products', methods=['GET'])
def get_farmer_products(farmer_id):
    """
    Get all products from a specific farmer
    """
    try:
        # Check if farmer exists
        farmer = User.query.filter_by(id=farmer_id, user_type='farmer').first()
        if not farmer:
            return jsonify({"status": "error", "message": "Farmer not found"}), 404
        
        # Get farmer's products
        from models_farmer_items import FarmerItem
        products = FarmerItem.query.filter_by(farmer_id=farmer_id).all()
        
        products_list = []
        for product in products:
            products_list.append({
                "id": product.id,
                "item_name": product.item_name,
                "price": product.price,
                "photo_path": product.photo_path,
                "location": product.location,
                "min_order_qty": product.min_order_qty,
                "available_stock": product.available_stock,
                "created_at": product.created_at.strftime("%Y-%m-%d %H:%M:%S") if hasattr(product, 'created_at') else None
            })
        
        return jsonify({
            "status": "success",
            "farmer": {
                "id": farmer.id,
                "fullname": farmer.fullname,
                "location": farmer.location
            },
            "products": products_list,
            "count": len(products_list)
        }), 200
        
    except Exception as e:
        print(f"Error getting farmer products: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# -----------------------------
# SEARCH FARMERS OR PRODUCTS
# -----------------------------
@consumer_bp.route('/search', methods=['GET'])
def search():
    """
    Search for farmers or products
    """
    search_query = request.args.get('q', '').strip()
    search_type = request.args.get('type', 'both')  # 'farmers', 'products', or 'both'
    
    if not search_query:
        return jsonify({"status": "error", "message": "Search query required"}), 400
    
    try:
        results = {"farmers": [], "products": []}
        
        # Search farmers
        if search_type in ['farmers', 'both']:
            farmers = User.query.filter(
                User.user_type == 'farmer',
                (User.fullname.ilike(f'%{search_query}%')) |
                (User.location.ilike(f'%{search_query}%'))
            ).limit(20).all()
            
            for farmer in farmers:
                results["farmers"].append({
                    "id": farmer.id,
                    "fullname": farmer.fullname,
                    "location": farmer.location,
                    "email": farmer.email
                })
        
        # Search products
        if search_type in ['products', 'both']:
            from models_farmer_items import FarmerItem
            from sqlalchemy import or_
            
            products = FarmerItem.query.filter(
                or_(
                    FarmerItem.item_name.ilike(f'%{search_query}%'),
                    FarmerItem.location.ilike(f'%{search_query}%')
                )
            ).limit(20).all()
            
            for product in products:
                # Get farmer info
                farmer = User.query.get(product.farmer_id)
                results["products"].append({
                    "id": product.id,
                    "item_name": product.item_name,
                    "price": product.price,
                    "photo_path": product.photo_path,
                    "location": product.location,
                    "farmer_id": product.farmer_id,
                    "farmer_name": farmer.fullname if farmer else "Unknown"
                })
        
        return jsonify({
            "status": "success",
            "query": search_query,
            "results": results,
            "counts": {
                "farmers": len(results["farmers"]),
                "products": len(results["products"])
            }
        }), 200
        
    except Exception as e:
        print(f"Error searching: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# -----------------------------
# TEST ENDPOINT
# -----------------------------
@consumer_bp.route('/test', methods=['GET'])
def test_consumer():
    """
    Test endpoint for consumer routes
    """
    return jsonify({
        "status": "success",
        "message": "Consumer endpoints are working",
        "endpoints": [
            "/consumer/nearby-products?lat=...&lon=... (GET)",
            "/consumer/farmer-details/<id> (GET)",
            "/consumer/profile (GET)",
            "/consumer/farmers (GET)",
            "/consumer/farmer/<id>/products (GET)",
            "/consumer/search?q=...&type=... (GET)"
        ]
    })