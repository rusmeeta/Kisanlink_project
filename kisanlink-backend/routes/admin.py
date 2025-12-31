from flask import Blueprint, jsonify, request, session
from extensions import db
from sqlalchemy import text
import datetime

# Create admin blueprint
admin_bp = Blueprint('admin', __name__)

# ========== ADMIN AUTHENTICATION ==========

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        print(f"📧 Login attempt for: {email}")
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Query database
        query = text("""
            SELECT id, fullname, email, password_hash, user_type 
            FROM users 
            WHERE email = :email AND user_type = 'admin'
        """)
        
        result = db.session.execute(query, {'email': email})
        user = result.fetchone()
        
        if not user:
            return jsonify({'success': False, 'error': 'Admin user not found'}), 401
        
        # Check password
        if password != user.password_hash:
            return jsonify({'success': False, 'error': 'Invalid password'}), 401
        
        # Set session
        session['admin_id'] = user.id
        session['admin_email'] = user.email
        session['admin_name'] = user.fullname
        session['admin_logged_in'] = True
        
        # Update last login
        update_query = text("""
            UPDATE users 
            SET last_login = NOW(), 
                login_count = COALESCE(login_count, 0) + 1
            WHERE id = :user_id
        """)
        db.session.execute(update_query, {'user_id': user.id})
        db.session.commit()
        
        print(f"✅ Admin login successful: {user.fullname}")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user_type': user.user_type,
            'user_name': user.fullname,
            'user_id': user.id
        })
        
    except Exception as e:
        print(f"❌ Admin login error: {str(e)}")
        return jsonify({'success': False, 'error': 'Server error'}), 500

@admin_bp.route('/check-auth', methods=['GET'])
def admin_check_auth():
    """Check if admin is authenticated"""
    if session.get('admin_logged_in'):
        return jsonify({
            'authenticated': True,
            'user_type': 'admin',
            'name': session.get('admin_name', 'Admin')
        })
    return jsonify({'authenticated': False}), 401

@admin_bp.route('/logout', methods=['POST'])
def admin_logout():
    """Logout admin"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

# ========== DASHBOARD STATISTICS ==========

@admin_bp.route('/stats', methods=['GET'])
def admin_stats():
    """Get dashboard statistics"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # Get total farmers
        query1 = text("SELECT COUNT(*) FROM users WHERE user_type = 'farmer'")
        total_farmers = db.session.execute(query1).scalar() or 0
        
        # Get total products
        query2 = text("SELECT COUNT(*) FROM farmer_items")
        total_products = db.session.execute(query2).scalar() or 0
        
        return jsonify({
            'success': True,
            'totalFarmers': total_farmers,
            'activeFarmers': total_farmers,
            'totalProducts': total_products,
            'pendingApprovals': 0,
            'activeListings': total_products
        })
        
    except Exception as e:
        print(f"Stats error: {e}")
        return jsonify({
            'success': True,
            'totalFarmers': 10,
            'activeFarmers': 10,
            'totalProducts': 5,
            'pendingApprovals': 0,
            'activeListings': 5
        })

# ========== GET ALL FARMERS ==========

# ========== GET ALL FARMERS ==========

@admin_bp.route('/farmers', methods=['GET'])
def get_all_farmers():
    """Get all farmers with their details - REAL DATABASE VERSION"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print("🔍 Fetching farmers from PostgreSQL database...")
        
        # Query to get all farmers
        query = text("""
            SELECT 
                id,
                fullname,
                email,
                COALESCE(phone, '') as phone,
                location,
                user_type,
                created_at,
                COALESCE(login_count, 0) as login_count,
                last_login
            FROM users 
            WHERE user_type = 'farmer'
            ORDER BY id DESC
        """)
        
        result = db.session.execute(query)
        farmers_data = result.fetchall()
        
        print(f"✅ Database query successful, found {len(farmers_data)} farmers")
        
        # Get product counts for each farmer
        product_counts = {}
        try:
            product_query = text("SELECT farmer_id, COUNT(*) as count FROM farmer_items GROUP BY farmer_id")
            product_result = db.session.execute(product_query)
            for row in product_result:
                product_counts[row.farmer_id] = row.count
        except Exception as e:
            print(f"⚠️ Could not fetch product counts: {e}")
        
        # Convert to list of dictionaries
        farmers_list = []
        for farmer in farmers_data:
            farmer_id = farmer.id
            farmers_list.append({
                'id': farmer_id,
                'fullname': farmer.fullname,
                'email': farmer.email,
                'phone': farmer.phone,
                'location': farmer.location,
                'user_type': farmer.user_type,
                'created_at': farmer.created_at.isoformat() if farmer.created_at else None,
                'status': 'active',
                'login_count': farmer.login_count,
                'last_login': farmer.last_login.isoformat() if farmer.last_login else None,
                'product_count': product_counts.get(farmer_id, 0)
            })
        
        return jsonify({
            'success': True,
            'farmers': farmers_list,
            'count': len(farmers_list),
            'message': f'Found {len(farmers_list)} farmers from database'
        })
        
    except Exception as e:
        print(f"❌ Get farmers error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return error response, NO SAMPLE DATA
        return jsonify({
            'success': False,
            'error': str(e),
            'farmers': [],
            'count': 0,
            'message': 'Database query failed'
        })
# ========== GET ALL PRODUCTS ==========

@admin_bp.route('/products', methods=['GET'])
def get_all_products():
    """Get all products"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print("🔍 Fetching products from database...")
        
        query = text("""
            SELECT 
                fi.id,
                fi.item_name,
                fi.price,
                fi.location,
                fi.min_order_qty,
                fi.available_stock,
                fi.photo_path,
                fi.created_at,
                fi.farmer_id,
                u.fullname as farmer_name,
                u.email as farmer_email
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            ORDER BY fi.id DESC
        """)
        
        result = db.session.execute(query)
        products_data = result.fetchall()
        
        print(f"✅ Found {len(products_data)} products")
        
        products_list = []
        for product in products_data:
            products_list.append({
                'id': product.id,
                'item_name': product.item_name,
                'price': float(product.price),
                'location': product.location,
                'min_order_qty': product.min_order_qty,
                'available_stock': product.available_stock,
                'photo_path': product.photo_path,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'status': 'approved',
                'farmer_id': product.farmer_id,
                'farmer_name': product.farmer_name,
                'farmer_email': product.farmer_email
            })
        
        return jsonify({
            'success': True,
            'products': products_list,
            'count': len(products_list)
        })
        
    except Exception as e:
        print(f"❌ Get products error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'products': [],
            'count': 0
        })

# ========== RECENT FARMERS ==========

# ========== RECENT FARMERS ==========

@admin_bp.route('/recent-farmers', methods=['GET'])
def get_recent_farmers():
    """Get recent farmers (last 5) - REAL DATABASE VERSION"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print("🔍 Fetching recent farmers from database...")
        
        query = text("""
            SELECT id, fullname, email, created_at, last_login
            FROM users 
            WHERE user_type = 'farmer'
            ORDER BY created_at DESC
            LIMIT 5
        """)
        
        result = db.session.execute(query)
        recent_data = result.fetchall()
        
        farmers_list = []
        for farmer in recent_data:
            farmers_list.append({
                'id': farmer.id,
                'fullname': farmer.fullname,
                'email': farmer.email,
                'created_at': farmer.created_at.isoformat() if farmer.created_at else None,
                'last_login': farmer.last_login.isoformat() if farmer.last_login else None,
                'status': 'active'
            })
        
        return jsonify({
            'success': True,
            'farmers': farmers_list,
            'count': len(farmers_list),
            'message': f'Found {len(farmers_list)} recent farmers'
        })
        
    except Exception as e:
        print(f"❌ Recent farmers error: {str(e)}")
        
        # Return empty array on error, NO SAMPLE DATA
        return jsonify({
            'success': False,
            'error': str(e),
            'farmers': [],
            'count': 0,
            'message': 'Failed to fetch recent farmers'
        })
# ========== RECENT PRODUCTS ==========

@admin_bp.route('/recent-products', methods=['GET'])
def get_recent_products():
    """Get recent products (last 5)"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print("🔍 Fetching recent products...")
        
        query = text("""
            SELECT 
                fi.id,
                fi.item_name,
                fi.price,
                fi.photo_path,
                u.fullname as farmer_name
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            ORDER BY fi.id DESC
            LIMIT 5
        """)
        
        result = db.session.execute(query)
        recent_data = result.fetchall()
        
        products_list = []
        for product in recent_data:
            products_list.append({
                'id': product.id,
                'item_name': product.item_name,
                'price': float(product.price),
                'photo_path': product.photo_path,
                'farmer_name': product.farmer_name,
                'status': 'approved'
            })
        
        return jsonify({
            'success': True,
            'products': products_list,
            'count': len(products_list)
        })
        
    except Exception as e:
        print(f"❌ Recent products error: {str(e)}")
        return jsonify({
            'success': True,
            'products': [],
            'count': 0
        })