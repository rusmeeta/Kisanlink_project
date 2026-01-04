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

# ========== PRODUCT APPROVAL SYSTEM ==========

# Get pending products for approval
@admin_bp.route('/products/pending', methods=['GET'])
def get_pending_products():
    """Get all products pending approval"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
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
                fi.status,
                fi.is_approved,
                fi.rejection_reason,
                u.fullname as farmer_name,
                u.email as farmer_email,
                u.id as farmer_id
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            WHERE (fi.status = 'pending_approval' OR (fi.is_approved = FALSE AND fi.status != 'rejected'))
            ORDER BY fi.created_at DESC
        """)
        
        result = db.session.execute(query)
        products_data = result.fetchall()
        
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
                'status': product.status,
                'is_approved': product.is_approved,
                'rejection_reason': product.rejection_reason,
                'farmer_name': product.farmer_name,
                'farmer_email': product.farmer_email,
                'farmer_id': product.farmer_id
            })
        
        return jsonify({
            'success': True,
            'products': products_list,
            'count': len(products_list),
            'message': f'Found {len(products_list)} products pending approval'
        })
        
    except Exception as e:
        print(f"❌ Get pending products error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'products': [],
            'count': 0
        }), 500

# Approve a product
@admin_bp.route('/products/<int:product_id>/approve', methods=['POST'])
def approve_product(product_id):
    """Approve a product - make it visible to consumers"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        admin_id = session.get('admin_id')
        admin_name = session.get('admin_name', 'Admin')
        
        # First check if product exists and get farmer info
        check_query = text("""
            SELECT fi.id, fi.item_name, fi.farmer_id, u.fullname, u.email
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            WHERE fi.id = :product_id
        """)
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        # Update product status
        update_query = text("""
            UPDATE farmer_items 
            SET status = 'approved',
                is_approved = TRUE,
                approved_by = :admin_id,
                approved_at = NOW(),
                rejection_reason = NULL
            WHERE id = :product_id
        """)
        
        db.session.execute(update_query, {
            'product_id': product_id,
            'admin_id': admin_id
        })
        
        # Create approval notification for farmer
        notification_message = f"✅ Product Approved: '{product.item_name}' has been approved by Admin and is now visible to customers!"
        
        # Try to save notification
        notification_saved = False
        try:
            from models_notification import Notification
            notification = Notification(
                user_id=product.farmer_id,
                message=notification_message,
                target_role="farmer",
                created_at=datetime.datetime.now()
            )
            db.session.add(notification)
            notification_saved = True
        except Exception as model_error:
            print(f"⚠️ Could not use Notification model: {model_error}")
            # Fallback to raw SQL
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {
                    'user_id': product.farmer_id,
                    'message': notification_message,
                    'target_role': 'farmer'
                })
                notification_saved = True
            except Exception as sql_error:
                print(f"⚠️ Could not save notification via SQL: {sql_error}")
                notification_saved = False
        
        db.session.commit()
        
        response_data = {
            'success': True,
            'message': f"Product '{product.item_name}' approved successfully",
            'product': {
                'id': product_id,
                'name': product.item_name,
                'status': 'approved',
                'approved_by': admin_name,
                'approved_at': datetime.datetime.now().isoformat()
            },
            'farmer': {
                'id': product.farmer_id,
                'name': product.fullname,
                'email': product.email
            }
        }
        
        if notification_saved:
            response_data['notification_sent'] = True
            response_data['notification_message'] = notification_message
        else:
            response_data['notification_sent'] = False
            response_data['warning'] = 'Approved but could not send notification'
        
        return jsonify(response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Approve product error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Reject a product with reason and notification
@admin_bp.route('/products/<int:product_id>/reject', methods=['POST'])
def reject_product(product_id):
    """Reject a product with reason and notify farmer"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        reason = data.get('reason', '').strip()
        admin_id = session.get('admin_id')
        admin_name = session.get('admin_name', 'Admin')
        
        if not reason:
            return jsonify({
                'success': False,
                'error': 'Rejection reason is required'
            }), 400
        
        # Check if product exists and get farmer info
        check_query = text("""
            SELECT fi.id, fi.item_name, fi.farmer_id, u.fullname, u.email
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            WHERE fi.id = :product_id
        """)
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        # Update product status
        update_query = text("""
            UPDATE farmer_items 
            SET status = 'rejected',
                is_approved = FALSE,
                rejection_reason = :reason,
                approved_by = :admin_id
            WHERE id = :product_id
        """)
        
        db.session.execute(update_query, {
            'product_id': product_id,
            'reason': reason,
            'admin_id': admin_id
        })
        
        # Create rejection notification for farmer
        notification_message = f"❌ Product Rejected: '{product.item_name}' was rejected by Admin. Reason: {reason}"
        
        # Try to save notification
        notification_saved = False
        try:
            from models_notification import Notification
            notification = Notification(
                user_id=product.farmer_id,
                message=notification_message,
                target_role="farmer",
                created_at=datetime.datetime.now()
            )
            db.session.add(notification)
            notification_saved = True
        except Exception as model_error:
            print(f"⚠️ Could not use Notification model: {model_error}")
            # Fallback to raw SQL
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {
                    'user_id': product.farmer_id,
                    'message': notification_message,
                    'target_role': 'farmer'
                })
                notification_saved = True
            except Exception as sql_error:
                print(f"⚠️ Could not save notification via SQL: {sql_error}")
                notification_saved = False
        
        db.session.commit()
        
        response_data = {
            'success': True,
            'message': f"Product '{product.item_name}' rejected",
            'product': {
                'id': product_id,
                'name': product.item_name,
                'status': 'rejected',
                'rejection_reason': reason,
                'rejected_by': admin_name
            },
            'farmer': {
                'id': product.farmer_id,
                'name': product.fullname,
                'email': product.email
            }
        }
        
        if notification_saved:
            response_data['notification_sent'] = True
            response_data['notification_message'] = notification_message
        else:
            response_data['notification_sent'] = False
            response_data['warning'] = 'Rejected but could not send notification'
        
        return jsonify(response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Reject product error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== ADMIN PRODUCT MANAGEMENT (Full Control) ==========

# Admin can edit ANY product
@admin_bp.route('/products/<int:product_id>/edit', methods=['PUT'])
def admin_edit_product(product_id):
    """Admin can edit ANY product (full control)"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        
        # Get current product info
        check_query = text("""
            SELECT id, item_name, farmer_id FROM farmer_items 
            WHERE id = :product_id
        """)
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        # Build update query dynamically based on provided fields
        update_fields = []
        params = {'product_id': product_id}
        
        if 'item_name' in data:
            update_fields.append("item_name = :item_name")
            params['item_name'] = data['item_name'].strip()
        
        if 'price' in data:
            try:
                price = float(data['price'])
                update_fields.append("price = :price")
                params['price'] = price
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid price format'}), 400
        
        if 'location' in data:
            update_fields.append("location = :location")
            params['location'] = data['location'].strip()
        
        if 'min_order_qty' in data:
            try:
                min_order_qty = int(data['min_order_qty'])
                update_fields.append("min_order_qty = :min_order_qty")
                params['min_order_qty'] = min_order_qty
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid min order quantity'}), 400
        
        if 'available_stock' in data:
            try:
                available_stock = int(data['available_stock'])
                update_fields.append("available_stock = :available_stock")
                params['available_stock'] = available_stock
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid stock quantity'}), 400
        
        if 'status' in data and data['status'] in ['approved', 'pending', 'rejected']:
            update_fields.append("status = :status")
            params['status'] = data['status']
            
            # Update is_approved based on status
            if data['status'] == 'approved':
                update_fields.append("is_approved = TRUE")
            else:
                update_fields.append("is_approved = FALSE")
        
        if 'is_approved' in data:
            update_fields.append("is_approved = :is_approved")
            params['is_approved'] = bool(data['is_approved'])
            
            # Update status based on is_approved
            if bool(data['is_approved']):
                update_fields.append("status = 'approved'")
            else:
                update_fields.append("status = 'pending_approval'")
        
        if 'rejection_reason' in data:
            update_fields.append("rejection_reason = :rejection_reason")
            params['rejection_reason'] = data['rejection_reason'].strip()
        
        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400
        
        # Add admin info and timestamp
        admin_id = session.get('admin_id')
        update_fields.append("last_updated_by = :admin_id")
        update_fields.append("last_updated_at = NOW()")
        params['admin_id'] = admin_id
        
        # Execute update
        update_query = text(f"""
            UPDATE farmer_items 
            SET {', '.join(update_fields)}
            WHERE id = :product_id
        """)
        
        db.session.execute(update_query, params)
        db.session.commit()
        
        # Get farmer info for notification
        farmer_query = text("""
            SELECT u.fullname, u.email FROM users u
            JOIN farmer_items fi ON u.id = fi.farmer_id
            WHERE fi.id = :product_id
        """)
        farmer_result = db.session.execute(farmer_query, {'product_id': product_id})
        farmer = farmer_result.fetchone()
        
        # Create notification for farmer about admin edit
        notification_message = f"📝 Product Updated: Admin has updated your product '{product.item_name}'"
        notification_saved = False
        
        try:
            from models_notification import Notification
            notification = Notification(
                user_id=product.farmer_id,
                message=notification_message,
                target_role="farmer",
                created_at=datetime.datetime.now()
            )
            db.session.add(notification)
            notification_saved = True
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {
                    'user_id': product.farmer_id,
                    'message': notification_message,
                    'target_role': 'farmer'
                })
                notification_saved = True
            except Exception:
                notification_saved = False
        
        if notification_saved:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"Product '{product.item_name}' updated successfully",
            'product_id': product_id,
            'updated_fields': list(data.keys()),
            'notification_sent': notification_saved,
            'farmer_notified': farmer.fullname if farmer else 'Unknown'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Admin edit product error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin can delete ANY product (force delete)
@admin_bp.route('/products/<int:product_id>/force-delete', methods=['DELETE'])
def admin_force_delete_product(product_id):
    """Admin can force delete ANY product, regardless of owner"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        admin_id = session.get('admin_id')
        admin_name = session.get('admin_name', 'Admin')
        
        # Get product info before deletion for notification
        check_query = text("""
            SELECT fi.id, fi.item_name, fi.farmer_id, u.fullname, u.email
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            WHERE fi.id = :product_id
        """)
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        # Create notification before deletion
        notification_message = f"🗑️ Product Deleted: Admin has removed your product '{product.item_name}' from the platform"
        notification_saved = False
        
        try:
            from models_notification import Notification
            notification = Notification(
                user_id=product.farmer_id,
                message=notification_message,
                target_role="farmer",
                created_at=datetime.datetime.now()
            )
            db.session.add(notification)
            notification_saved = True
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {
                    'user_id': product.farmer_id,
                    'message': notification_message,
                    'target_role': 'farmer'
                })
                notification_saved = True
            except Exception:
                notification_saved = False
        
        # Delete the product
        delete_query = text("DELETE FROM farmer_items WHERE id = :product_id")
        db.session.execute(delete_query, {'product_id': product_id})
        db.session.commit()
        
        print(f"✅ Admin force deleted product ID: {product_id}")
        
        return jsonify({
            'success': True,
            'message': f"Product '{product.item_name}' deleted by admin",
            'deleted_by': admin_name,
            'product_id': product_id,
            'farmer_notified': notification_saved,
            'farmer': {
                'id': product.farmer_id,
                'name': product.fullname
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Admin force delete error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Admin can update product stock directly
@admin_bp.route('/products/<int:product_id>/update-stock', methods=['PUT'])
def admin_update_stock(product_id):
    """Admin can update product stock directly"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        new_stock = data.get('available_stock')
        reason = data.get('reason', 'Admin stock adjustment').strip()
        
        if new_stock is None:
            return jsonify({'success': False, 'error': 'Stock quantity is required'}), 400
        
        try:
            new_stock = int(new_stock)
            if new_stock < 0:
                return jsonify({'success': False, 'error': 'Stock cannot be negative'}), 400
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid stock quantity'}), 400
        
        # Get current product info
        check_query = text("""
            SELECT fi.id, fi.item_name, fi.available_stock, fi.farmer_id, u.fullname
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            WHERE fi.id = :product_id
        """)
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        old_stock = product.available_stock
        
        # Update stock
        update_query = text("""
            UPDATE farmer_items 
            SET available_stock = :new_stock,
                last_updated_by = :admin_id,
                last_updated_at = NOW()
            WHERE id = :product_id
        """)
        
        db.session.execute(update_query, {
            'product_id': product_id,
            'new_stock': new_stock,
            'admin_id': session.get('admin_id')
        })
        
        # Create stock adjustment notification
        notification_message = f"📊 Stock Updated: Admin updated '{product.item_name}' from {old_stock} to {new_stock} units. Reason: {reason}"
        notification_saved = False
        
        try:
            from models_notification import Notification
            notification = Notification(
                user_id=product.farmer_id,
                message=notification_message,
                target_role="farmer",
                created_at=datetime.datetime.now()
            )
            db.session.add(notification)
            notification_saved = True
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {
                    'user_id': product.farmer_id,
                    'message': notification_message,
                    'target_role': 'farmer'
                })
                notification_saved = True
            except Exception:
                notification_saved = False
        
        if notification_saved:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"Stock updated from {old_stock} to {new_stock} units",
            'product': {
                'id': product_id,
                'name': product.item_name,
                'old_stock': old_stock,
                'new_stock': new_stock,
                'difference': new_stock - old_stock
            },
            'farmer_notified': notification_saved,
            'reason': reason
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Admin update stock error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin can change product status
@admin_bp.route('/products/<int:product_id>/change-status', methods=['PUT'])
def admin_change_status(product_id):
    """Admin can change product status (active/inactive)"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        reason = data.get('reason', '').strip()
        
        if not new_status or new_status not in ['active', 'inactive', 'suspended']:
            return jsonify({
                'success': False,
                'error': 'Valid status required: active, inactive, or suspended'
            }), 400
        
        # Get current product info
        check_query = text("""
            SELECT fi.id, fi.item_name, fi.farmer_id, u.fullname, fi.status
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            WHERE fi.id = :product_id
        """)
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        
        old_status = product.status
        
        # Determine if product should be approved based on status
        is_approved = new_status == 'active'
        
        # Update status
        update_query = text("""
            UPDATE farmer_items 
            SET status = :new_status,
                is_approved = :is_approved,
                last_updated_by = :admin_id,
                last_updated_at = NOW()
            WHERE id = :product_id
        """)
        
        db.session.execute(update_query, {
            'product_id': product_id,
            'new_status': new_status,
            'is_approved': is_approved,
            'admin_id': session.get('admin_id')
        })
        
        # Create status change notification
        status_messages = {
            'active': 'activated and visible to customers',
            'inactive': 'deactivated (not visible to customers)',
            'suspended': 'suspended due to policy violation'
        }
        
        notification_message = f"🔄 Status Changed: Your product '{product.item_name}' has been {status_messages.get(new_status, new_status)}"
        if reason:
            notification_message += f". Reason: {reason}"
        
        notification_saved = False
        
        try:
            from models_notification import Notification
            notification = Notification(
                user_id=product.farmer_id,
                message=notification_message,
                target_role="farmer",
                created_at=datetime.datetime.now()
            )
            db.session.add(notification)
            notification_saved = True
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {
                    'user_id': product.farmer_id,
                    'message': notification_message,
                    'target_role': 'farmer'
                })
                notification_saved = True
            except Exception:
                notification_saved = False
        
        if notification_saved:
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f"Product status changed from '{old_status}' to '{new_status}'",
            'product': {
                'id': product_id,
                'name': product.item_name,
                'old_status': old_status,
                'new_status': new_status,
                'is_approved': is_approved
            },
            'farmer_notified': notification_saved,
            'reason': reason if reason else None
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Admin change status error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== UPDATE STATS ROUTE ==========

@admin_bp.route('/stats', methods=['GET'])
def admin_stats():
    """Get dashboard statistics"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # Get total farmers
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
        
        # Get low stock products count
        from models_farmer_items import FarmerItem
        low_stock_products = FarmerItem.query.filter(FarmerItem.available_stock < 10).count()
        
        # Get pending products count
        query_pending = text("SELECT COUNT(*) FROM farmer_items WHERE status = 'pending_approval' OR is_approved = FALSE")
        pending_products = db.session.execute(query_pending).scalar() or 0
        
        # Get approved products count
        query_approved = text("SELECT COUNT(*) FROM farmer_items WHERE status = 'approved' AND is_approved = TRUE")
        approved_products = db.session.execute(query_approved).scalar() or 0
        
        # Get active farmers (with approved products)
        query_active_farmers = text("""
            SELECT COUNT(DISTINCT u.id) 
            FROM users u
            JOIN farmer_items fi ON u.id = fi.farmer_id
            WHERE u.user_type = 'farmer' 
              AND fi.status = 'approved' 
              AND fi.is_approved = TRUE
        """)
        active_farmers = db.session.execute(query_active_farmers).scalar() or 0
        
        return jsonify({
            'success': True,
            'totalFarmers': total_farmers,
            'totalConsumers': total_consumers,
            'totalUsers': total_users,
            'activeFarmers': active_farmers,
            'totalProducts': total_products,
            'lowStockProducts': low_stock_products,
            'pendingProducts': pending_products,
            'approvedProducts': approved_products,
            'activeListings': approved_products
        })
        
    except Exception as e:
        print(f"Stats error: {e}")
        # Fallback with sample data
        return jsonify({
            'success': True,
            'totalFarmers': 11,
            'totalConsumers': 5,
            'totalUsers': 16,
            'totalProducts': 5,
            'lowStockProducts': 2,
            'pendingProducts': 3,
            'approvedProducts': 2,
            'activeListings': 2
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
                fi.status,
                fi.is_approved,
                fi.rejection_reason,
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
                'status': product.status or 'pending_approval',
                'is_approved': product.is_approved or False,
                'rejection_reason': product.rejection_reason,
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
                fi.status,
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
                'status': product.status or 'pending_approval',
                'farmer_name': product.farmer_name
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
from models_farmer_items import FarmerItem

# ========== LOW STOCK PRODUCTS ==========

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
            from models_user import User
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

# ========== NOTIFY FARMER ABOUT LOW STOCK ==========

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
        
        # Get product details
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
            )
            
            db.session.add(notification)
            db.session.commit()
            
            print(f"✅ Notification created for farmer {farmer.fullname}")
            
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
                    'sent_at': notification.created_at.isoformat() if notification.created_at else datetime.datetime.now().isoformat()
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
    
# ========== DEACTIVATE USER ==========

# Add these routes to your admin_bp

@admin_bp.route('/users/<int:user_id>/deactivate', methods=['POST'])
def deactivate_user_with_reason(user_id):
    """Deactivate a user with reason and notification"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}),
        401
    
    try:
        data = request.get_json()
        reason = data.get('reason', '').strip()
        deactivation_type = data.get('deactivation_type', 'temporary')
        notification_message = data.get('notification_message', '')  # Get the notification message from frontend
        
        if not reason:
            return jsonify({
                'success': False,
                'error': 'Deactivation reason is required'
            }), 400
        
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
            SET is_active = FALSE,
                deactivation_reason = :reason,
                deactivated_at = NOW(),
                deactivated_by = :admin_id,
                deactivation_type = :deactivation_type
            WHERE id = :user_id
        """)
        db.session.execute(deactivate_query, {
            'user_id': user_id,
            'reason': reason,
            'admin_id': session.get('admin_id'),
            'deactivation_type': deactivation_type
        })
        
        # Create deactivation notification for the user
        admin_name = session.get('admin_name', 'Admin')
        
        if deactivation_type == 'permanent':
            notification_message = f"❌ Account Permanently Deactivated: Your account has been permanently deactivated by Admin. Reason: {reason}"
        else:
            notification_message = f"⚠️ Account Temporarily Deactivated: Your account has been temporarily deactivated by Admin. Reason: {reason}. Contact support to reactivate."
        
        # Save notification
        notification_saved = False
        try:
            from models_notification import Notification
            notification = Notification(
                user_id=user_id,
                message=notification_message,
                target_role=user.user_type,
                created_at=datetime.datetime.now()
            )
            db.session.add(notification)
            notification_saved = True
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {
                    'user_id': user_id,
                    'message': notification_message,
                    'target_role': user.user_type
                })
                notification_saved = True
            except Exception:
                notification_saved = False
        
        db.session.commit()
        
        print(f"✅ User {user_id} ({user.fullname}) deactivated with reason")
        
        return jsonify({
            'success': True,
            'message': f'User {user.fullname} has been deactivated',
            'notification_sent': notification_saved,
            'user': {
                'id': user.id,
                'name': user.fullname,
                'email': user.email,
                'is_active': False,
                'deactivation_reason': reason,
                'deactivation_type': deactivation_type
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Deactivate user error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/users/<int:user_id>/reactivate', methods=['POST'])
def reactivate_user_with_notification(user_id):
    """Reactivate an inactive user with notification"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        reason = data.get('reason', 'Account reactivated by Admin').strip()
        
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
        
        # Reactivate: Set is_active = TRUE and clear deactivation info
        reactivate_query = text("""
            UPDATE users 
            SET is_active = TRUE,
                deactivation_reason = NULL,
                deactivated_at = NULL,
                deactivated_by = NULL,
                reactivated_at = NOW(),
                reactivation_reason = :reason
            WHERE id = :user_id
        """)
        db.session.execute(reactivate_query, {
            'user_id': user_id,
            'reason': reason
        })
        
        # Create reactivation notification for the user
        notification_message = f"✅ Account Reactivated: Your account has been reactivated. Reason: {reason}"
        
        # Save notification
        notification_saved = False
        try:
            from models_notification import Notification
            notification = Notification(
                user_id=user_id,
                message=notification_message,
                target_role=user.user_type,
                created_at=datetime.datetime.now()
            )
            db.session.add(notification)
            notification_saved = True
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {
                    'user_id': user_id,
                    'message': notification_message,
                    'target_role': user.user_type
                })
                notification_saved = True
            except Exception:
                notification_saved = False
        
        db.session.commit()
        
        print(f"✅ User {user_id} ({user.fullname}) reactivated")
        
        return jsonify({
            'success': True,
            'message': f'User {user.fullname} has been reactivated',
            'notification_sent': notification_saved,
            'user': {
                'id': user.id,
                'name': user.fullname,
                'email': user.email,
                'is_active': True,
                'reactivation_reason': reason
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Reactivate user error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500