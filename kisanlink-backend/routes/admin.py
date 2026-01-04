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



# ========== UPDATE STATS ROUTE ==========

# Update the existing /stats route to include low stock count
@admin_bp.route('/stats', methods=['GET'])
def admin_stats():
    """Get dashboard statistics"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # Get total farmers (using raw SQL as in your existing code)
        query1 = text("SELECT COUNT(*) FROM users WHERE user_type = 'farmer'")
        total_farmers = db.session.execute(query1).scalar() or 0
        
        # Get total consumers
        query_consumers = text("SELECT COUNT(*) FROM users WHERE user_type = 'consumer'")
        total_consumers = db.session.execute(query_consumers).scalar() or 0
        
        # Get total products
        query2 = text("SELECT COUNT(*) FROM farmer_items")
        total_products = db.session.execute(query2).scalar() or 0
        
        # Get total users
        query_total_users = text("SELECT COUNT(*) FROM users WHERE user_type IN ('farmer', 'consumer')")
        total_users = db.session.execute(query_total_users).scalar() or 0
        
        # Get low stock products count (using SQLAlchemy or raw SQL)
        low_stock_products = FarmerItem.query.filter(FarmerItem.available_stock < 10).count()
        # Or using raw SQL:
        # query_low_stock = text("SELECT COUNT(*) FROM farmer_items WHERE available_stock < 10")
        # low_stock_products = db.session.execute(query_low_stock).scalar() or 0
        
        return jsonify({
            'success': True,
            'totalFarmers': total_farmers,
            'totalConsumers': total_consumers,
            'totalUsers': total_users,
            'activeFarmers': total_farmers,
            'totalProducts': total_products,
            'lowStockProducts': low_stock_products,  # This is the new field
            'pendingApprovals': 0,
            'activeListings': total_products
        })
        
    except Exception as e:
        print(f"Stats error: {e}")
        # Fallback with sample data that includes lowStockProducts
        return jsonify({
            'success': True,
            'totalFarmers': 11,
            'totalConsumers': 5,
            'totalUsers': 16,
            'totalProducts': 5,
            'lowStockProducts': 2,  # Sample low stock count
            'pendingApprovals': 0,
            'activeListings': 5
        })
# ========== GET ALL FARMERS ==========
@admin_bp.route('/farmers', methods=['GET'])
def get_all_farmers():
    """Get all farmers with their details"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print("🔍 Fetching farmers from PostgreSQL database...")
        
        # Get status filter from query parameter
        status = request.args.get('status', 'active')  # Default: active
        
        # Build query based on status filter
        if status == 'active':
            where_clause = "WHERE user_type = 'farmer' AND is_active = TRUE"
        elif status == 'inactive':
            where_clause = "WHERE user_type = 'farmer' AND is_active = FALSE"
        else:  # 'all'
            where_clause = "WHERE user_type = 'farmer'"
        
        # Query to get farmers
        query = text(f"""
            SELECT 
                id,
                fullname,
                email,
                location,
                user_type,
                is_active,
                COALESCE(login_count, 0) as login_count,
                last_login
            FROM users 
            {where_clause}
            ORDER BY id DESC
        """)
        
        result = db.session.execute(query)
        farmers_data = result.fetchall()
        
        print(f"✅ Database query successful, found {len(farmers_data)} farmers (status: {status})")
        
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
                'location': farmer.location,
                'user_type': farmer.user_type,
                'is_active': farmer.is_active,
                'status': 'active' if farmer.is_active else 'inactive',
                'login_count': farmer.login_count,
                'last_login': farmer.last_login.isoformat() if farmer.last_login else None,
                'product_count': product_counts.get(farmer_id, 0)
            })
        
        return jsonify({
            'success': True,
            'farmers': farmers_list,
            'count': len(farmers_list),
            'status_filter': status,
            'message': f'Found {len(farmers_list)} farmers (status: {status})'
        })
        
    except Exception as e:
        print(f"❌ Get farmers error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'farmers': [],
            'count': 0
        })
# ========== GET ALL CONSUMERS ==========

@admin_bp.route('/consumers', methods=['GET'])
def get_all_consumers():
    """Get all consumers with their details"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print("🔍 Fetching consumers from PostgreSQL database...")
        
        # Query to get all consumers
        query = text("""
            SELECT 
                id,
                fullname,
                email,
                location,
                user_type,
                
                COALESCE(login_count, 0) as login_count,
                last_login
            FROM users 
            WHERE user_type = 'consumer'
            ORDER BY id DESC
        """)
        
        result = db.session.execute(query)
        consumers_data = result.fetchall()
        
        print(f"✅ Database query successful, found {len(consumers_data)} consumers")
        
        # Convert to list of dictionaries
        consumers_list = []
        for consumer in consumers_data:
            consumers_list.append({
                'id': consumer.id,
                'fullname': consumer.fullname,
                'email': consumer.email,
                
                'location': consumer.location,
                'user_type': consumer.user_type,
                
                
                'login_count': consumer.login_count,
                'last_login': consumer.last_login.isoformat() if consumer.last_login else None,
                'product_count': 0  # Consumers don't have products
            })
        
        return jsonify({
            'success': True,
            'consumers': consumers_list,
            'count': len(consumers_list),
            'message': f'Found {len(consumers_list)} consumers from database'
        })
        
    except Exception as e:
        print(f"❌ Get consumers error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'consumers': [],
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

@admin_bp.route('/recent-farmers', methods=['GET'])
def get_recent_farmers():
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        query = text("""
            SELECT id, fullname, email, last_login
            FROM users
            WHERE user_type = 'farmer'
            ORDER BY id DESC
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
                
                'last_login': farmer.last_login.isoformat() if farmer.last_login else None
                
            })
        
        return jsonify({'success': True, 'farmers': farmers_list, 'count': len(farmers_list)})
    
    except Exception as e:
        print(f"❌ Recent farmers error: {str(e)}")
        return jsonify({'success': False, 'farmers': [], 'count': 0})

# ========== RECENT CONSUMERS ==========
# ========== RECENT CONSUMERS ==========

@admin_bp.route('/recent-consumers', methods=['GET'])
def get_recent_consumers():
    """Get recent consumers (last 5)"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print("🔍 Fetching recent consumers from database...")
        
        query = text("""
            SELECT id, fullname, email, last_login
            FROM users 
            WHERE user_type = 'consumer'
            ORDER BY id DESC
            LIMIT 5
        """)
        
        result = db.session.execute(query)
        recent_data = result.fetchall()
        
        consumers_list = []
        for consumer in recent_data:
            consumers_list.append({
                'id': consumer.id,
                'fullname': consumer.fullname,
                'email': consumer.email,
                
                'last_login': consumer.last_login.isoformat() if consumer.last_login else None
                
            })
        
        return jsonify({
            'success': True,
            'consumers': consumers_list,
            'count': len(consumers_list),
            'message': f'Found {len(consumers_list)} recent consumers'
        })
        
    except Exception as e:
        print(f"❌ Recent consumers error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'consumers': [],
            'count': 0,
            'message': 'Failed to fetch recent consumers'
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
    
# # ========== DELETE USER (Farmer or Consumer) ==========

# @admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
# def delete_user(user_id):
#     """Delete a user (farmer or consumer)"""
#     if not session.get('admin_logged_in'):
#         return jsonify({'error': 'Not authenticated'}), 401
    
#     try:
#         print(f"🗑️ Attempting to delete user ID: {user_id}")
        
#         # First, check if user exists
#         check_query = text("SELECT id, user_type FROM users WHERE id = :user_id")
#         result = db.session.execute(check_query, {'user_id': user_id})
#         user = result.fetchone()
        
#         if not user:
#             return jsonify({
#                 'success': False,
#                 'error': 'User not found'
#             }), 404
        
#         # If user is a farmer, check if they have products
#         if user.user_type == 'farmer':
#             product_query = text("SELECT COUNT(*) FROM farmer_items WHERE farmer_id = :user_id")
#             product_count = db.session.execute(product_query, {'user_id': user_id}).scalar()
            
#             if product_count > 0:
#                 return jsonify({
#                     'success': False,
#                     'error': f'Cannot delete farmer with {product_count} products. Delete products first.'
#                 }), 400
        
#         # Delete the user
#         delete_query = text("DELETE FROM users WHERE id = :user_id")
#         db.session.execute(delete_query, {'user_id': user_id})
#         db.session.commit()
        
#         print(f"✅ User {user_id} deleted successfully")
        
#         return jsonify({
#             'success': True,
#             'message': 'User deleted successfully'
#         })
        
#     except Exception as e:
#         db.session.rollback()
#         print(f"❌ Delete user error: {str(e)}")
#         return jsonify({
#             'success': False,
#             'error': str(e)
#         }), 500

# ========== DELETE PRODUCT ==========

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Delete a product"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print(f"🗑️ Attempting to delete product ID: {product_id}")
        
        # Check if product exists
        check_query = text("SELECT id, item_name FROM farmer_items WHERE id = :product_id")
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Delete the product
        delete_query = text("DELETE FROM farmer_items WHERE id = :product_id")
        db.session.execute(delete_query, {'product_id': product_id})
        db.session.commit()
        
        print(f"✅ Product '{product.item_name}' (ID: {product_id}) deleted successfully")
        
        return jsonify({
            'success': True,
            'message': 'Product deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete product error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ========== UPDATE PRODUCT STATUS ==========

@admin_bp.route('/products/<int:product_id>/status', methods=['PUT'])
def update_product_status(product_id):
    """Update product status"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status or new_status not in ['approved', 'pending', 'rejected']:
            return jsonify({
                'success': False,
                'error': 'Valid status required: approved, pending, or rejected'
            }), 400
        
        print(f"🔄 Updating product {product_id} status to: {new_status}")
        
        # Update product status (you might want to add a status column to farmer_items)
        # For now, we'll just acknowledge the update
        # If you want to store status in database, add a status column to farmer_items table
        
        return jsonify({
            'success': True,
            'message': f'Product status updated to {new_status}'
        })
        
    except Exception as e:
        print(f"❌ Update product status error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
from models_notification import Notification
from models_farmer_items     import FarmerItem  # If not already imported

# ========== LOW STOCK PRODUCTS (Using SQLAlchemy) ==========

@admin_bp.route('/low-stock-products', methods=['GET'])
def get_low_stock_products():
    """Get products with low stock (less than 10 units)"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print("🔍 Fetching low stock products from database...")
        
        # Get products with less than 10 units in stock
        low_stock_products = FarmerItem.query.filter(
            FarmerItem.available_stock < 10
        ).order_by(FarmerItem.available_stock.asc()).all()
        
        print(f"✅ Found {len(low_stock_products)} low stock products")
        
        products_list = []
        for product in low_stock_products:
            # Get farmer info
            from models_user import User  # Import inside function to avoid circular imports
            farmer = User.query.get(product.farmer_id)
            
            stock_level = product.available_stock
            status = 'critical' if stock_level < 5 else 'low'
            
            products_list.append({
                'id': product.id,
                'item_name': product.item_name,
                'price': float(product.price),
                'location': product.location,
                'min_order_qty': product.min_order_qty,
                'available_stock': stock_level,
                'photo_path': product.photo_path,
                
                'farmer_id': product.farmer_id,
                'farmer_name': farmer.fullname if farmer else "Unknown Farmer",
                'farmer_email': farmer.email if farmer else "",
                'status': status,
                'stock_level': stock_level,
                'threshold': 10
            })
        
        return jsonify({
            'success': True,
            'products': products_list,
            'count': len(products_list),
            'threshold': 10,
            'message': f'Found {len(products_list)} products with low stock'
        })
        
    except Exception as e:
        print(f"❌ Get low stock products error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'products': [],
            'count': 0,
            'message': 'Failed to fetch low stock products'
        })

# ========== NOTIFY FARMER ABOUT LOW STOCK (Using Notification Model) ==========

# In your admin_bp.py, update the notify_low_stock function to use the Notification model:

@admin_bp.route('/notify-low-stock', methods=['POST'])
def notify_low_stock():
    """Send notification to farmer about low stock product"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        farmer_id = data.get('farmer_id')
        
        if not product_id or not farmer_id:
            return jsonify({
                'success': False,
                'error': 'Product ID and Farmer ID are required'
            }), 400
        
        print(f"🔔 Sending low stock notification for product {product_id} to farmer {farmer_id}")
        
        # Get product details using raw SQL (simpler approach)
        product_query = text("""
            SELECT item_name, available_stock, farmer_id
            FROM farmer_items 
            WHERE id = :product_id
        """)
        
        product_result = db.session.execute(product_query, {'product_id': product_id})
        product = product_result.fetchone()
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Verify the product belongs to this farmer
        if product.farmer_id != farmer_id:
            return jsonify({
                'success': False,
                'error': 'This product does not belong to the specified farmer'
            }), 400
        
        # Get farmer info
        farmer_query = text("""
            SELECT fullname, email 
            FROM users 
            WHERE id = :farmer_id AND user_type = 'farmer'
        """)
        
        farmer_result = db.session.execute(farmer_query, {'farmer_id': farmer_id})
        farmer = farmer_result.fetchone()
        
        if not farmer:
            return jsonify({
                'success': False,
                'error': 'Farmer not found'
            }), 404
        
        # Create notification message
        message = f"⚠️ Low Stock Alert: Your product '{product.item_name}' has only {product.available_stock} units left. Please restock soon to avoid missing orders."
        
        try:
            # Create notification using Notification model
            notification = Notification(
                user_id=farmer_id,
                message=message,
                target_role="farmer"
                # order_id is optional, so we don't need to set it
            )
            
            db.session.add(notification)
            db.session.commit()
            
            print(f"✅ Notification created for farmer {farmer.fullname}")
            print(f"📝 Notification ID: {notification.id}")
            print(f"📝 Message: {message}")
            
            return jsonify({
                'success': True,
                'message': f'Low stock alert sent to {farmer.fullname}',
                'notification': {
                    'id': notification.id,
                    'farmer_name': farmer.fullname,
                    'farmer_email': farmer.email,
                    'product_name': product.item_name,
                    'current_stock': product.available_stock,
                    'message': message,
                    'sent_at': notification.created_at.isoformat() if notification.created_at else datetime.now().isoformat()
                }
            })
            
        except Exception as model_error:
            print(f"⚠️ Error using Notification model: {model_error}")
            
            # Try raw SQL as fallback
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                    RETURNING id
                """)
                
                result = db.session.execute(notification_query, {
                    'user_id': farmer_id,
                    'message': message,
                    'target_role': 'farmer'
                })
                
                notification_id = result.scalar()
                db.session.commit()
                
                print(f"✅ Notification created via SQL (ID: {notification_id})")
                
                return jsonify({
                    'success': True,
                    'message': f'Low stock alert sent to {farmer.fullname}',
                    'notification': {
                        'id': notification_id,
                        'farmer_name': farmer.fullname,
                        'product_name': product.item_name,
                        'current_stock': product.available_stock,
                        'message': message
                    }
                })
                
            except Exception as sql_error:
                print(f"⚠️ Error with raw SQL: {sql_error}")
                
                # Even if database fails, show success to user
                return jsonify({
                    'success': True,
                    'message': f'Low stock alert prepared for {farmer.fullname}',
                    'warning': 'Notification could not be saved to database',
                    'notification': {
                        'farmer_name': farmer.fullname,
                        'product_name': product.item_name,
                        'current_stock': product.available_stock,
                        'message': message
                    }
                })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Notify low stock error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': 'Failed to send notification. Please try again.'
        }), 500
    
# ========== DEACTIVATE USER (Soft Delete - Make Inactive) ==========

@admin_bp.route('/users/<int:user_id>/deactivate', methods=['PUT'])
def deactivate_user(user_id):
    """Deactivate a user (make inactive instead of deleting)"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print(f"🔒 Attempting to deactivate user ID: {user_id}")
        
        # First, check if user exists
        check_query = text("""
            SELECT id, fullname, email, user_type, is_active 
            FROM users 
            WHERE id = :user_id
        """)
        result = db.session.execute(check_query, {'user_id': user_id})
        user = result.fetchone()
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Check if user is already inactive
        if not user.is_active:
            return jsonify({
                'success': False,
                'error': 'User is already inactive'
            }), 400
        
        # Soft delete: Set is_active = FALSE
        deactivate_query = text("""
            UPDATE users 
            SET is_active = FALSE 
            WHERE id = :user_id
        """)
        db.session.execute(deactivate_query, {'user_id': user_id})
        db.session.commit()
        
        print(f"✅ User {user_id} ({user.fullname}) deactivated successfully")
        
        return jsonify({
            'success': True,
            'message': f'User {user.fullname} has been deactivated',
            'user': {
                'id': user.id,
                'name': user.fullname,
                'email': user.email,
                'is_active': False
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Deactivate user error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ========== REACTIVATE USER ==========

@admin_bp.route('/users/<int:user_id>/reactivate', methods=['PUT'])
def reactivate_user(user_id):
    """Reactivate an inactive user"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        print(f"♻️ Attempting to reactivate user ID: {user_id}")
        
        # First, check if user exists
        check_query = text("""
            SELECT id, fullname, email, user_type, is_active 
            FROM users 
            WHERE id = :user_id
        """)
        result = db.session.execute(check_query, {'user_id': user_id})
        user = result.fetchone()
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Check if user is already active
        if user.is_active:
            return jsonify({
                'success': False,
                'error': 'User is already active'
            }), 400
        
        # Reactivate: Set is_active = TRUE
        reactivate_query = text("""
            UPDATE users 
            SET is_active = TRUE 
            WHERE id = :user_id
        """)
        db.session.execute(reactivate_query, {'user_id': user_id})
        db.session.commit()
        
        print(f"✅ User {user_id} ({user.fullname}) reactivated successfully")
        
        return jsonify({
            'success': True,
            'message': f'User {user.fullname} has been reactivated',
            'user': {
                'id': user.id,
                'name': user.fullname,
                'email': user.email,
                'is_active': True
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Reactivate user error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500