from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from extensions import db
from sqlalchemy import text
import datetime

admin_bp = Blueprint('admin', __name__)

# ========== ADMIN AUTHENTICATION (JWT) ==========

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password required'}), 400

        query = text("""
            SELECT id, fullname, email, password_hash, user_type
            FROM users
            WHERE email = :email AND user_type = 'admin'
        """)
        result = db.session.execute(query, {'email': email})
        user = result.fetchone()

        if not user:
            return jsonify({'success': False, 'error': 'Admin user not found'}), 401

        # **IMPORTANT**: Replace this with proper password hashing (e.g., check_password_hash)
        if password != user.password_hash:
            return jsonify({'success': False, 'error': 'Invalid password'}), 401

        access_token = create_access_token(identity=str(user.id))

        update_query = text("""
            UPDATE users
            SET last_login = NOW(), login_count = COALESCE(login_count, 0) + 1
            WHERE id = :user_id
        """)
        db.session.execute(update_query, {'user_id': user.id})
        db.session.commit()

        return jsonify({
            'success': True,
            'access_token': access_token,
            'user': {
                'id': user.id,
                'fullname': user.fullname,
                'email': user.email,
                'user_type': user.user_type
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': 'Server error'}), 500


@admin_bp.route('/check-auth', methods=['GET'])
@jwt_required()
def admin_check_auth():
    user_id = get_jwt_identity()
    user = db.session.execute(
        text("SELECT fullname FROM users WHERE id = :id AND user_type = 'admin'"),
        {'id': user_id}
    ).fetchone()
    if user:
        return jsonify({'authenticated': True, 'name': user.fullname, 'user_type': 'admin'})
    return jsonify({'authenticated': False}), 401


@admin_bp.route('/logout', methods=['POST'])
@jwt_required()
def admin_logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'})


# ========== ALL OTHER ADMIN ROUTES (now protected by JWT) ==========

@admin_bp.route('/products/pending', methods=['GET'])
@jwt_required()
def get_pending_products():
    admin_id = get_jwt_identity()  # not used but ensures auth
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
        return jsonify({'success': False, 'error': str(e), 'products': [], 'count': 0}), 500


@admin_bp.route('/products/<int:product_id>/approve', methods=['POST'])
@jwt_required()
def approve_product(product_id):
    admin_id = int(get_jwt_identity())
    admin_name = db.session.execute(
        text("SELECT fullname FROM users WHERE id = :id"),
        {'id': admin_id}
    ).scalar() or 'Admin'

    try:
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

        update_query = text("""
            UPDATE farmer_items 
            SET status = 'approved',
                is_approved = TRUE,
                approved_by = :admin_id,
                approved_at = NOW(),
                rejection_reason = NULL
            WHERE id = :product_id
        """)
        db.session.execute(update_query, {'product_id': product_id, 'admin_id': admin_id})

        notification_message = f"✅ Product Approved: '{product.item_name}' has been approved by Admin and is now visible to customers!"
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
            'farmer': {'id': product.farmer_id, 'name': product.fullname, 'email': product.email}
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


@admin_bp.route('/products/<int:product_id>/reject', methods=['POST'])
@jwt_required()
def reject_product(product_id):
    admin_id = int(get_jwt_identity())
    admin_name = db.session.execute(
        text("SELECT fullname FROM users WHERE id = :id"),
        {'id': admin_id}
    ).scalar() or 'Admin'

    try:
        data = request.get_json()
        reason = data.get('reason', '').strip()
        if not reason:
            return jsonify({'success': False, 'error': 'Rejection reason is required'}), 400

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

        update_query = text("""
            UPDATE farmer_items 
            SET status = 'rejected',
                is_approved = FALSE,
                rejection_reason = :reason,
                approved_by = :admin_id
            WHERE id = :product_id
        """)
        db.session.execute(update_query, {'product_id': product_id, 'reason': reason, 'admin_id': admin_id})

        notification_message = f"❌ Product Rejected: '{product.item_name}' was rejected by Admin. Reason: {reason}"
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
            'farmer': {'id': product.farmer_id, 'name': product.fullname, 'email': product.email}
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


@admin_bp.route('/products/<int:product_id>/edit', methods=['PUT'])
@jwt_required()
def admin_edit_product(product_id):
    admin_id = int(get_jwt_identity())
    try:
        data = request.get_json()
        check_query = text("SELECT id, item_name, farmer_id FROM farmer_items WHERE id = :product_id")
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404

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
            if data['status'] == 'approved':
                update_fields.append("is_approved = TRUE")
            else:
                update_fields.append("is_approved = FALSE")
        if 'is_approved' in data:
            update_fields.append("is_approved = :is_approved")
            params['is_approved'] = bool(data['is_approved'])
            if bool(data['is_approved']):
                update_fields.append("status = 'approved'")
            else:
                update_fields.append("status = 'pending_approval'")
        if 'rejection_reason' in data:
            update_fields.append("rejection_reason = :rejection_reason")
            params['rejection_reason'] = data['rejection_reason'].strip()

        if not update_fields:
            return jsonify({'success': False, 'error': 'No fields to update'}), 400

        update_fields.append("last_updated_by = :admin_id")
        update_fields.append("last_updated_at = NOW()")
        params['admin_id'] = admin_id

        update_query = text(f"UPDATE farmer_items SET {', '.join(update_fields)} WHERE id = :product_id")
        db.session.execute(update_query, params)

        # Notify farmer
        farmer_query = text("""
            SELECT u.fullname, u.email FROM users u
            JOIN farmer_items fi ON u.id = fi.farmer_id
            WHERE fi.id = :product_id
        """)
        farmer_result = db.session.execute(farmer_query, {'product_id': product_id})
        farmer = farmer_result.fetchone()

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


@admin_bp.route('/products/<int:product_id>/force-delete', methods=['DELETE'])
@jwt_required()
def admin_force_delete_product(product_id):
    admin_id = int(get_jwt_identity())
    admin_name = db.session.execute(
        text("SELECT fullname FROM users WHERE id = :id"),
        {'id': admin_id}
    ).scalar() or 'Admin'

    try:
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

        delete_query = text("DELETE FROM farmer_items WHERE id = :product_id")
        db.session.execute(delete_query, {'product_id': product_id})
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Product '{product.item_name}' deleted by admin",
            'deleted_by': admin_name,
            'product_id': product_id,
            'farmer_notified': notification_saved,
            'farmer': {'id': product.farmer_id, 'name': product.fullname}
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Admin force delete error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/products/<int:product_id>/update-stock', methods=['PUT'])
@jwt_required()
def admin_update_stock(product_id):
    admin_id = int(get_jwt_identity())
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
        update_query = text("""
            UPDATE farmer_items 
            SET available_stock = :new_stock,
                last_updated_by = :admin_id,
                last_updated_at = NOW()
            WHERE id = :product_id
        """)
        db.session.execute(update_query, {'product_id': product_id, 'new_stock': new_stock, 'admin_id': admin_id})

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
            'product': {'id': product_id, 'name': product.item_name, 'old_stock': old_stock, 'new_stock': new_stock, 'difference': new_stock - old_stock},
            'farmer_notified': notification_saved,
            'reason': reason
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Admin update stock error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/products/<int:product_id>/change-status', methods=['PUT'])
@jwt_required()
def admin_change_status(product_id):
    admin_id = int(get_jwt_identity())
    try:
        data = request.get_json()
        new_status = data.get('status')
        reason = data.get('reason', '').strip()
        if not new_status or new_status not in ['active', 'inactive', 'suspended']:
            return jsonify({'success': False, 'error': 'Valid status required: active, inactive, or suspended'}), 400

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
        is_approved = new_status == 'active'
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
            'admin_id': admin_id
        })

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
            'product': {'id': product_id, 'name': product.item_name, 'old_status': old_status, 'new_status': new_status, 'is_approved': is_approved},
            'farmer_notified': notification_saved,
            'reason': reason if reason else None
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Admin change status error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def admin_stats():
    admin_id = get_jwt_identity()  # unused but ensures auth
    try:
        # All existing stats queries (same as before)
        active_farmers_query = text("SELECT COUNT(*) FROM users WHERE user_type = 'farmer' AND is_active = TRUE")
        total_farmers = db.session.execute(active_farmers_query).scalar() or 0

        active_consumers_query = text("SELECT COUNT(*) FROM users WHERE user_type = 'consumer' AND is_active = TRUE")
        total_consumers = db.session.execute(active_consumers_query).scalar() or 0

        total_products_query = text("SELECT COUNT(*) FROM farmer_items")
        total_products = db.session.execute(total_products_query).scalar() or 0

        approved_products_query = text("""
            SELECT COUNT(*) FROM farmer_items 
            WHERE status = 'approved' AND is_approved = TRUE AND status != 'rejected'
        """)
        approved_products = db.session.execute(approved_products_query).scalar() or 0

        pending_products_query = text("""
            SELECT COUNT(*) FROM farmer_items 
            WHERE status = 'pending_approval' OR (is_approved = FALSE AND status != 'rejected')
        """)
        pending_products = db.session.execute(pending_products_query).scalar() or 0

        rejected_products_query = text("SELECT COUNT(*) FROM farmer_items WHERE status = 'rejected'")
        rejected_products = db.session.execute(rejected_products_query).scalar() or 0

        low_stock_query = text("""
            SELECT COUNT(*) FROM farmer_items 
            WHERE available_stock < 10 AND available_stock > 0
              AND status = 'approved' AND is_approved = TRUE AND status != 'rejected'
        """)
        low_stock_products = db.session.execute(low_stock_query).scalar() or 0

        out_of_stock_query = text("""
            SELECT COUNT(*) FROM farmer_items 
            WHERE available_stock <= 0
              AND status = 'approved' AND is_approved = TRUE AND status != 'rejected'
        """)
        out_of_stock_products = db.session.execute(out_of_stock_query).scalar() or 0

        critical_stock_query = text("""
            SELECT COUNT(*) FROM farmer_items 
            WHERE available_stock < 5 AND available_stock > 0
              AND status = 'approved' AND is_approved = TRUE AND status != 'rejected'
        """)
        critical_stock = db.session.execute(critical_stock_query).scalar() or 0

        farmers_with_products_query = text("""
            SELECT COUNT(DISTINCT farmer_id) 
            FROM farmer_items 
            WHERE status = 'approved' AND is_approved = TRUE
        """)
        active_farmers = db.session.execute(farmers_with_products_query).scalar() or 0

        recent_products_query = text("""
            SELECT COUNT(*) FROM farmer_items 
            WHERE created_at >= NOW() - INTERVAL '7 days'
        """)
        recent_products = db.session.execute(recent_products_query).scalar() or 0

        return jsonify({
            'success': True,
            'totalFarmers': total_farmers,
            'totalConsumers': total_consumers,
            'totalUsers': total_farmers + total_consumers,
            'totalProducts': total_products,
            'approvedProducts': approved_products,
            'pendingProducts': pending_products,
            'rejectedProducts': rejected_products,
            'lowStockProducts': low_stock_products,
            'outOfStockProducts': out_of_stock_products,
            'criticalStockProducts': critical_stock,
            'activeFarmers': active_farmers,
            'recentProducts': recent_products,
            'productStatus': {
                'approved': approved_products,
                'pending': pending_products,
                'rejected': rejected_products
            },
            'stockStatus': {
                'critical': critical_stock,
                'low': low_stock_products - critical_stock,
                'out': out_of_stock_products
            }
        })
    except Exception as e:
        print(f"❌ Stats error: {e}")
        return jsonify({'success': False, 'error': str(e), 'message': 'Failed to load statistics'}), 500


@admin_bp.route('/farmers', methods=['GET'])
@jwt_required()
def get_all_farmers():
    admin_id = get_jwt_identity()
    try:
        status = request.args.get('status', 'active')
        if status == 'active':
            where_clause = "WHERE user_type = 'farmer' AND is_active = TRUE"
        elif status == 'inactive':
            where_clause = "WHERE user_type = 'farmer' AND is_active = FALSE"
        else:
            where_clause = "WHERE user_type = 'farmer'"

        query = text(f"""
            SELECT 
                id, fullname, email, location, user_type, is_active,
                COALESCE(login_count, 0) as login_count, last_login,
                deactivation_reason, deactivated_at, deactivation_type, deactivated_by,
                reactivated_at, reactivation_reason,
                is_email_verified, email_verified_at
            FROM users 
            {where_clause}
            ORDER BY id DESC
        """)
        result = db.session.execute(query)
        farmers_data = result.fetchall()

        # Get product counts
        product_counts = {}
        try:
            product_query = text("SELECT farmer_id, COUNT(*) as count FROM farmer_items GROUP BY farmer_id")
            product_result = db.session.execute(product_query)
            for row in product_result:
                product_counts[row.farmer_id] = row.count
        except Exception:
            pass

        # Get admin names for deactivated_by
        admin_names = {}
        try:
            admin_query = text("SELECT id, fullname FROM users WHERE user_type = 'admin'")
            admin_result = db.session.execute(admin_query)
            for admin in admin_result:
                admin_names[admin.id] = admin.fullname
        except Exception:
            pass

        farmers_list = []
        for farmer in farmers_data:
            deactivated_by_name = None
            if farmer.deactivated_by and farmer.deactivated_by in admin_names:
                deactivated_by_name = admin_names[farmer.deactivated_by]
            farmers_list.append({
                'id': farmer.id,
                'fullname': farmer.fullname,
                'email': farmer.email,
                'location': farmer.location,
                'user_type': farmer.user_type,
                'is_active': farmer.is_active,
                'status': 'active' if farmer.is_active else 'inactive',
                'login_count': farmer.login_count,
                'last_login': farmer.last_login.isoformat() if farmer.last_login else None,
                'product_count': product_counts.get(farmer.id, 0),
                'deactivation_reason': farmer.deactivation_reason,
                'deactivation_type': farmer.deactivation_type,
                'deactivated_at': farmer.deactivated_at.isoformat() if farmer.deactivated_at else None,
                'deactivated_by_name': deactivated_by_name,
                'deactivated_by': farmer.deactivated_by,
                'reactivated_at': farmer.reactivated_at.isoformat() if farmer.reactivated_at else None,
                'reactivation_reason': farmer.reactivation_reason,
                'is_email_verified': farmer.is_email_verified,
                'email_verified_at': farmer.email_verified_at.isoformat() if farmer.email_verified_at else None
            })

        return jsonify({'success': True, 'farmers': farmers_list, 'count': len(farmers_list), 'status_filter': status})
    except Exception as e:
        print(f"❌ Get farmers error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'farmers': [], 'count': 0}), 500


@admin_bp.route('/consumers', methods=['GET'])
@jwt_required()
def get_all_consumers():
    admin_id = get_jwt_identity()
    try:
        status = request.args.get('status', 'active')
        if status == 'active':
            where_clause = "WHERE user_type = 'consumer' AND is_active = TRUE"
        elif status == 'inactive':
            where_clause = "WHERE user_type = 'consumer' AND is_active = FALSE"
        else:
            where_clause = "WHERE user_type = 'consumer'"

        query = text(f"""
            SELECT 
                id, fullname, email, location, user_type, is_active,
                COALESCE(login_count, 0) as login_count, last_login,
                deactivation_reason, deactivated_at, deactivation_type, deactivated_by,
                reactivated_at, reactivation_reason,
                is_email_verified, email_verified_at
            FROM users 
            {where_clause}
            ORDER BY id DESC
        """)
        result = db.session.execute(query)
        consumers_data = result.fetchall()

        admin_names = {}
        try:
            admin_query = text("SELECT id, fullname FROM users WHERE user_type = 'admin'")
            admin_result = db.session.execute(admin_query)
            for admin in admin_result:
                admin_names[admin.id] = admin.fullname
        except Exception:
            pass

        consumers_list = []
        for consumer in consumers_data:
            deactivated_by_name = None
            if consumer.deactivated_by and consumer.deactivated_by in admin_names:
                deactivated_by_name = admin_names[consumer.deactivated_by]
            consumers_list.append({
                'id': consumer.id,
                'fullname': consumer.fullname,
                'email': consumer.email,
                'location': consumer.location,
                'user_type': consumer.user_type,
                'is_active': consumer.is_active,
                'status': 'active' if consumer.is_active else 'inactive',
                'login_count': consumer.login_count,
                'last_login': consumer.last_login.isoformat() if consumer.last_login else None,
                'deactivation_reason': consumer.deactivation_reason,
                'deactivation_type': consumer.deactivation_type,
                'deactivated_at': consumer.deactivated_at.isoformat() if consumer.deactivated_at else None,
                'deactivated_by_name': deactivated_by_name,
                'deactivated_by': consumer.deactivated_by,
                'reactivated_at': consumer.reactivated_at.isoformat() if consumer.reactivated_at else None,
                'reactivation_reason': consumer.reactivation_reason,
                'is_email_verified': consumer.is_email_verified,
                'email_verified_at': consumer.email_verified_at.isoformat() if consumer.email_verified_at else None
            })

        return jsonify({'success': True, 'consumers': consumers_list, 'count': len(consumers_list), 'status_filter': status})
    except Exception as e:
        print(f"❌ Get consumers error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'consumers': [], 'count': 0}), 500


@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def get_all_products():
    admin_id = get_jwt_identity()
    try:
        query = text("""
            SELECT 
                fi.id, fi.item_name, fi.price, fi.location, fi.min_order_qty,
                fi.available_stock, fi.photo_path, fi.status, fi.is_approved,
                fi.rejection_reason, fi.farmer_id,
                u.fullname as farmer_name, u.email as farmer_email
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            ORDER BY fi.id DESC
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
                'status': product.status or 'pending_approval',
                'is_approved': product.is_approved or False,
                'rejection_reason': product.rejection_reason,
                'farmer_id': product.farmer_id,
                'farmer_name': product.farmer_name,
                'farmer_email': product.farmer_email
            })

        return jsonify({'success': True, 'products': products_list, 'count': len(products_list)})
    except Exception as e:
        print(f"❌ Get products error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'products': [], 'count': 0}), 500


@admin_bp.route('/recent-farmers', methods=['GET'])
@jwt_required()
def get_recent_farmers():
    admin_id = get_jwt_identity()
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
        farmers_list = [{'id': f.id, 'fullname': f.fullname, 'email': f.email, 'last_login': f.last_login.isoformat() if f.last_login else None} for f in recent_data]
        return jsonify({'success': True, 'farmers': farmers_list, 'count': len(farmers_list)})
    except Exception as e:
        print(f"❌ Recent farmers error: {str(e)}")
        return jsonify({'success': False, 'farmers': [], 'count': 0}), 500


@admin_bp.route('/recent-consumers', methods=['GET'])
@jwt_required()
def get_recent_consumers():
    admin_id = get_jwt_identity()
    try:
        query = text("""
            SELECT id, fullname, email, last_login
            FROM users 
            WHERE user_type = 'consumer'
            ORDER BY id DESC
            LIMIT 5
        """)
        result = db.session.execute(query)
        recent_data = result.fetchall()
        consumers_list = [{'id': c.id, 'fullname': c.fullname, 'email': c.email, 'last_login': c.last_login.isoformat() if c.last_login else None} for c in recent_data]
        return jsonify({'success': True, 'consumers': consumers_list, 'count': len(consumers_list)})
    except Exception as e:
        print(f"❌ Recent consumers error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'consumers': [], 'count': 0}), 500


@admin_bp.route('/recent-products', methods=['GET'])
@jwt_required()
def get_recent_products():
    admin_id = get_jwt_identity()
    try:
        query = text("""
            SELECT fi.id, fi.item_name, fi.price, fi.photo_path, fi.status, u.fullname as farmer_name
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            ORDER BY fi.id DESC
            LIMIT 5
        """)
        result = db.session.execute(query)
        recent_data = result.fetchall()
        products_list = [{'id': p.id, 'item_name': p.item_name, 'price': float(p.price), 'photo_path': p.photo_path, 'status': p.status or 'pending_approval', 'farmer_name': p.farmer_name} for p in recent_data]
        return jsonify({'success': True, 'products': products_list, 'count': len(products_list)})
    except Exception as e:
        print(f"❌ Recent products error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'products': [], 'count': 0}), 500


@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    admin_id = get_jwt_identity()
    try:
        check_query = text("SELECT id, item_name FROM farmer_items WHERE id = :product_id")
        result = db.session.execute(check_query, {'product_id': product_id})
        product = result.fetchone()
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        delete_query = text("DELETE FROM farmer_items WHERE id = :product_id")
        db.session.execute(delete_query, {'product_id': product_id})
        db.session.commit()
        return jsonify({'success': True, 'message': 'Product deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete product error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/products/<int:product_id>/status', methods=['PUT'])
@jwt_required()
def update_product_status(product_id):
    admin_id = get_jwt_identity()
    try:
        data = request.get_json()
        new_status = data.get('status')
        if not new_status or new_status not in ['approved', 'pending', 'rejected']:
            return jsonify({'success': False, 'error': 'Valid status required: approved, pending, or rejected'}), 400
        # This route is a stub; you can implement actual status update if needed.
        return jsonify({'success': True, 'message': f'Product status updated to {new_status}'})
    except Exception as e:
        print(f"❌ Update product status error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== LOW STOCK, NOTIFICATIONS, DEACTIVATION, ETC. ==========
# All those routes also need @jwt_required() and use admin_id = get_jwt_identity()

@admin_bp.route('/low-stock-products', methods=['GET'])
@jwt_required()
def get_low_stock_products():
    admin_id = get_jwt_identity()
    try:
        query = text("""
            SELECT 
                fi.id, fi.item_name, fi.price, fi.location, fi.min_order_qty,
                fi.available_stock, fi.photo_path, fi.farmer_id,
                u.fullname as farmer_name, u.email as farmer_email
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            WHERE fi.available_stock < 10 
              AND COALESCE(fi.status, 'pending') != 'rejected'
              AND COALESCE(fi.is_approved, false) = true
            ORDER BY fi.available_stock ASC
        """)
        result = db.session.execute(query)
        products = result.fetchall()
        products_list = []
        for p in products:
            stock_level = p.available_stock
            status = 'critical' if stock_level < 5 else 'low'
            products_list.append({
                'id': p.id,
                'item_name': p.item_name,
                'price': float(p.price),
                'location': p.location,
                'min_order_qty': p.min_order_qty,
                'available_stock': stock_level,
                'photo_path': p.photo_path,
                'farmer_id': p.farmer_id,
                'farmer_name': p.farmer_name,
                'farmer_email': p.farmer_email,
                'status': status,
                'stock_level': stock_level
            })
        return jsonify({'success': True, 'products': products_list, 'count': len(products_list)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e), 'products': [], 'count': 0}), 500


@admin_bp.route('/notify-low-stock', methods=['POST'])
@jwt_required()
def notify_low_stock():
    admin_id = get_jwt_identity()
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        farmer_id = data.get('farmer_id')
        if not product_id or not farmer_id:
            return jsonify({'success': False, 'error': 'Product ID and Farmer ID are required'}), 400

        product_query = text("SELECT item_name, available_stock, farmer_id FROM farmer_items WHERE id = :product_id")
        product_result = db.session.execute(product_query, {'product_id': product_id})
        product = product_result.fetchone()
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
        if product.farmer_id != farmer_id:
            return jsonify({'success': False, 'error': 'Product does not belong to this farmer'}), 400

        farmer_query = text("SELECT fullname, email FROM users WHERE id = :farmer_id AND user_type = 'farmer'")
        farmer_result = db.session.execute(farmer_query, {'farmer_id': farmer_id})
        farmer = farmer_result.fetchone()
        if not farmer:
            return jsonify({'success': False, 'error': 'Farmer not found'}), 404

        message = f"⚠️ Low Stock Alert: Your product '{product.item_name}' has only {product.available_stock} units left. Please restock soon to avoid missing orders."
        try:
            from models_notification import Notification
            notification = Notification(user_id=farmer_id, message=message, target_role="farmer")
            db.session.add(notification)
            db.session.commit()
            return jsonify({
                'success': True,
                'message': f'Low stock alert sent to {farmer.fullname}',
                'notification': {
                    'id': notification.id,
                    'farmer_name': farmer.fullname,
                    'product_name': product.item_name,
                    'current_stock': product.available_stock,
                    'message': message,
                    'sent_at': notification.created_at.isoformat() if notification.created_at else datetime.datetime.now().isoformat()
                }
            })
        except Exception as model_error:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW()) RETURNING id
                """)
                result = db.session.execute(notification_query, {'user_id': farmer_id, 'message': message, 'target_role': 'farmer'})
                notification_id = result.scalar()
                db.session.commit()
                return jsonify({
                    'success': True,
                    'message': f'Low stock alert sent to {farmer.fullname}',
                    'notification': {'id': notification_id, 'farmer_name': farmer.fullname, 'product_name': product.item_name, 'current_stock': product.available_stock, 'message': message}
                })
            except Exception:
                return jsonify({
                    'success': True,
                    'message': f'Low stock alert prepared for {farmer.fullname}',
                    'warning': 'Notification could not be saved to database',
                    'notification': {'farmer_name': farmer.fullname, 'product_name': product.item_name, 'current_stock': product.available_stock, 'message': message}
                })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Notify low stock error: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to send notification'}), 500


@admin_bp.route('/users/<int:user_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_user_with_reason(user_id):
    admin_id = int(get_jwt_identity())
    try:
        data = request.get_json()
        reason = data.get('reason', '').strip()
        deactivation_type = data.get('deactivation_type', 'temporary')
        if not reason:
            return jsonify({'success': False, 'error': 'Deactivation reason is required'}), 400

        check_query = text("SELECT id, fullname, email, user_type, is_active FROM users WHERE id = :user_id")
        user = db.session.execute(check_query, {'user_id': user_id}).fetchone()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if not user.is_active:
            return jsonify({'success': False, 'error': 'User is already inactive'}), 400

        deactivate_query = text("""
            UPDATE users 
            SET is_active = FALSE,
                deactivation_reason = :reason,
                deactivated_at = NOW(),
                deactivated_by = :admin_id,
                deactivation_type = :deactivation_type
            WHERE id = :user_id
        """)
        db.session.execute(deactivate_query, {'user_id': user_id, 'reason': reason, 'admin_id': admin_id, 'deactivation_type': deactivation_type})

        notification_message = f"❌ Account {'Permanently' if deactivation_type == 'permanent' else 'Temporarily'} Deactivated: Your account has been deactivated by Admin. Reason: {reason}" + ("" if deactivation_type == 'permanent' else " Contact support to reactivate.")
        try:
            from models_notification import Notification
            notification = Notification(user_id=user_id, message=notification_message, target_role=user.user_type)
            db.session.add(notification)
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {'user_id': user_id, 'message': notification_message, 'target_role': user.user_type})
            except Exception:
                pass
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'User {user.fullname} has been deactivated',
            'user': {'id': user.id, 'name': user.fullname, 'email': user.email, 'is_active': False, 'deactivation_reason': reason, 'deactivation_type': deactivation_type}
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Deactivate user error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/reactivate', methods=['POST'])
@jwt_required()
def reactivate_user_with_notification(user_id):
    admin_id = get_jwt_identity()
    try:
        data = request.get_json()
        reason = data.get('reason', 'Account reactivated by Admin').strip()
        check_query = text("SELECT id, fullname, email, user_type, is_active FROM users WHERE id = :user_id")
        user = db.session.execute(check_query, {'user_id': user_id}).fetchone()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        if user.is_active:
            return jsonify({'success': False, 'error': 'User is already active'}), 400

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
        db.session.execute(reactivate_query, {'user_id': user_id, 'reason': reason})

        notification_message = f"✅ Account Reactivated: Your account has been reactivated. Reason: {reason}"
        try:
            from models_notification import Notification
            notification = Notification(user_id=user_id, message=notification_message, target_role=user.user_type)
            db.session.add(notification)
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {'user_id': user_id, 'message': notification_message, 'target_role': user.user_type})
            except Exception:
                pass
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'User {user.fullname} has been reactivated',
            'user': {'id': user.id, 'name': user.fullname, 'email': user.email, 'is_active': True, 'reactivation_reason': reason}
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Reactivate user error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/products/<int:product_id>/notification-history', methods=['GET'])
@jwt_required()
def get_product_notification_history(product_id):
    admin_id = get_jwt_identity()
    try:
        product_query = text("SELECT fi.id, fi.item_name, fi.farmer_id, u.fullname as farmer_name FROM farmer_items fi JOIN users u ON fi.farmer_id = u.id WHERE fi.id = :product_id")
        product = db.session.execute(product_query, {'product_id': product_id}).fetchone()
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404

        notification_query = text("""
            SELECT id, message, created_at, target_role
            FROM notifications 
            WHERE user_id = :farmer_id 
              AND (message LIKE '%low stock%' OR message LIKE '%Low Stock%')
            ORDER BY created_at DESC
        """)
        notifications = db.session.execute(notification_query, {'farmer_id': product.farmer_id}).fetchall()
        all_notifications = [{'id': n.id, 'message': n.message, 'created_at': n.created_at.isoformat() if n.created_at else None, 'target_role': n.target_role} for n in notifications]

        # Also get product-specific messages
        try:
            product_pattern = f'%{product.item_name}%'
            product_notifications = db.session.execute(
                text("SELECT id, message, created_at, target_role FROM notifications WHERE user_id = :farmer_id AND message LIKE :pattern ORDER BY created_at DESC"),
                {'farmer_id': product.farmer_id, 'pattern': product_pattern}
            ).fetchall()
            for n in product_notifications:
                if not any(x['id'] == n.id for x in all_notifications):
                    all_notifications.append({'id': n.id, 'message': n.message, 'created_at': n.created_at.isoformat() if n.created_at else None, 'target_role': n.target_role})
        except Exception:
            pass

        all_notifications.sort(key=lambda x: x['created_at'] or '', reverse=True)
        return jsonify({
            'success': True,
            'product': {'id': product.id, 'item_name': product.item_name, 'farmer_id': product.farmer_id, 'farmer_name': product.farmer_name},
            'notifications': all_notifications,
            'count': len(all_notifications)
        })
    except Exception as e:
        print(f"❌ Get notification history error: {str(e)}")
        return jsonify({'success': False, 'error': str(e), 'notifications': [], 'count': 0}), 500


@admin_bp.route('/products/<int:product_id>/delete-low-stock', methods=['DELETE'])
@jwt_required()
def delete_low_stock_product(product_id):
    admin_id = get_jwt_identity()
    try:
        data = request.get_json()
        reason = data.get('reason', 'Low stock product removed').strip()
        check_query = text("""
            SELECT fi.id, fi.item_name, fi.available_stock, fi.farmer_id, u.fullname as farmer_name, u.email as farmer_email
            FROM farmer_items fi
            JOIN users u ON fi.farmer_id = u.id
            WHERE fi.id = :product_id AND fi.available_stock < 10
        """)
        product = db.session.execute(check_query, {'product_id': product_id}).fetchone()
        if not product:
            return jsonify({'success': False, 'error': 'Product not found or not low on stock'}), 404

        notification_message = f"🗑️ Product Deleted: Your product '{product.item_name}' has been removed from low stock list. Reason: {reason}"
        notification_saved = False
        try:
            from models_notification import Notification
            notification = Notification(user_id=product.farmer_id, message=notification_message, target_role="farmer")
            db.session.add(notification)
            notification_saved = True
        except Exception:
            try:
                notification_query = text("""
                    INSERT INTO notifications (user_id, message, target_role, created_at)
                    VALUES (:user_id, :message, :target_role, NOW())
                """)
                db.session.execute(notification_query, {'user_id': product.farmer_id, 'message': notification_message, 'target_role': 'farmer'})
                notification_saved = True
            except Exception:
                notification_saved = False

        delete_query = text("DELETE FROM farmer_items WHERE id = :product_id")
        db.session.execute(delete_query, {'product_id': product_id})
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f"Product '{product.item_name}' deleted successfully",
            'notification_sent': notification_saved,
            'product': {'id': product_id, 'name': product.item_name, 'farmer_name': product.farmer_name, 'deletion_reason': reason}
        })
    except Exception as e:
        db.session.rollback()
        print(f"❌ Delete low stock product error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== EDIT REQUESTS ==========

@admin_bp.route('/edit-requests/pending', methods=['GET'])
@jwt_required()
def get_pending_edit_requests():
    admin_id = get_jwt_identity()
    try:
        query = text("""
            SELECT 
                er.id as request_id,
                er.product_id,
                er.farmer_id,
                u.fullname as farmer_name,
                u.email as farmer_email,
                er.current_item_name,
                er.current_price,
                er.current_location,
                er.current_min_order_qty,
                er.current_available_stock,
                er.current_photo_path,
                er.proposed_item_name,
                er.proposed_price,
                er.proposed_location,
                er.proposed_min_order_qty,
                er.proposed_available_stock,
                er.proposed_photo_path,
                er.proposed_latitude,
                er.proposed_longitude,
                er.requested_at,
                er.edit_status
            FROM product_edit_requests er
            JOIN users u ON er.farmer_id = u.id
            WHERE er.edit_status = 'edit_pending'
            ORDER BY er.requested_at DESC
        """)
        result = db.session.execute(query)
        requests = result.fetchall()
        requests_list = []
        for req in requests:
            requests_list.append({
                'request_id': req.request_id,
                'product_id': req.product_id,
                'farmer_id': req.farmer_id,
                'farmer_name': req.farmer_name,
                'farmer_email': req.farmer_email,
                'current_data': {
                    'item_name': req.current_item_name,
                    'price': float(req.current_price),
                    'location': req.current_location,
                    'min_order_qty': req.current_min_order_qty,
                    'available_stock': req.current_available_stock,
                    'photo_path': req.current_photo_path
                },
                'proposed_data': {
                    'item_name': req.proposed_item_name,
                    'price': float(req.proposed_price),
                    'location': req.proposed_location,
                    'min_order_qty': req.proposed_min_order_qty,
                    'available_stock': req.proposed_available_stock,
                    'photo_path': req.proposed_photo_path,
                    'latitude': req.proposed_latitude,
                    'longitude': req.proposed_longitude
                },
                'requested_at': req.requested_at.isoformat() if req.requested_at else None,
                'status': req.edit_status
            })
        return jsonify({'success': True, 'edit_requests': requests_list, 'count': len(requests_list)})
    except Exception as e:
        print(f"❌ Get pending edit requests error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/edit-requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_edit_request(request_id):
    admin_id = int(get_jwt_identity())
    try:
        query = text("""
            SELECT 
                er.product_id, er.farmer_id,
                er.proposed_item_name, er.proposed_price,
                er.proposed_location, er.proposed_min_order_qty,
                er.proposed_available_stock, er.proposed_photo_path,
                er.proposed_latitude, er.proposed_longitude,
                fi.item_name as current_name
            FROM product_edit_requests er
            JOIN farmer_items fi ON er.product_id = fi.id
            WHERE er.id = :request_id
        """)
        edit_request = db.session.execute(query, {'request_id': request_id}).fetchone()
        if not edit_request:
            return jsonify({'success': False, 'error': 'Edit request not found'}), 404

        update_query = text("""
            UPDATE farmer_items 
            SET 
                item_name = :item_name,
                price = :price,
                location = :location,
                min_order_qty = :min_order_qty,
                available_stock = :available_stock,
                photo_path = :photo_path,
                latitude = :latitude,
                longitude = :longitude,
                has_pending_edit = FALSE,
                edit_status = 'edit_approved',
                approved_by = :admin_id,
                approved_at = NOW()
            WHERE id = :product_id
        """)
        db.session.execute(update_query, {
            'product_id': edit_request.product_id,
            'item_name': edit_request.proposed_item_name,
            'price': edit_request.proposed_price,
            'location': edit_request.proposed_location,
            'min_order_qty': edit_request.proposed_min_order_qty,
            'available_stock': edit_request.proposed_available_stock,
            'photo_path': edit_request.proposed_photo_path,
            'latitude': edit_request.proposed_latitude,
            'longitude': edit_request.proposed_longitude,
            'admin_id': admin_id
        })

        update_request_query = text("""
            UPDATE product_edit_requests 
            SET edit_status = 'edit_approved', reviewed_by = :admin_id, reviewed_at = NOW()
            WHERE id = :request_id
        """)
        db.session.execute(update_request_query, {'request_id': request_id, 'admin_id': admin_id})

        # Notify farmer
        notification_message = f"✅ Edit Approved: Your changes to '{edit_request.current_name}' have been approved!"
        try:
            notification_query = text("""
                INSERT INTO notifications (user_id, message, target_role, created_at)
                VALUES (:user_id, :message, :target_role, NOW())
            """)
            db.session.execute(notification_query, {'user_id': edit_request.farmer_id, 'message': notification_message, 'target_role': 'farmer'})
        except Exception:
            pass

        db.session.commit()
        return jsonify({'success': True, 'message': 'Edit request approved successfully', 'product_id': edit_request.product_id})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Approve edit request error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/edit-requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_edit_request(request_id):
    admin_id = int(get_jwt_identity())
    try:
        data = request.get_json()
        reason = data.get('reason', '').strip()
        if not reason:
            return jsonify({'success': False, 'error': 'Rejection reason is required'}), 400

        query = text("SELECT product_id, farmer_id, current_item_name as current_name FROM product_edit_requests WHERE id = :request_id")
        edit_request = db.session.execute(query, {'request_id': request_id}).fetchone()
        if not edit_request:
            return jsonify({'success': False, 'error': 'Edit request not found'}), 404

        update_product_query = text("UPDATE farmer_items SET has_pending_edit = FALSE, edit_status = 'edit_rejected' WHERE id = :product_id")
        db.session.execute(update_product_query, {'product_id': edit_request.product_id})

        update_request_query = text("""
            UPDATE product_edit_requests 
            SET edit_status = 'edit_rejected', reviewed_by = :admin_id, reviewed_at = NOW(), rejection_reason = :reason
            WHERE id = :request_id
        """)
        db.session.execute(update_request_query, {'request_id': request_id, 'admin_id': admin_id, 'reason': reason})

        notification_message = f"❌ Edit Rejected: Your changes to '{edit_request.current_name}' were rejected. Reason: {reason}"
        try:
            notification_query = text("""
                INSERT INTO notifications (user_id, message, target_role, created_at)
                VALUES (:user_id, :message, :target_role, NOW())
            """)
            db.session.execute(notification_query, {'user_id': edit_request.farmer_id, 'message': notification_message, 'target_role': 'farmer'})
        except Exception:
            pass

        db.session.commit()
        return jsonify({'success': True, 'message': 'Edit request rejected', 'rejection_reason': reason})
    except Exception as e:
        db.session.rollback()
        print(f"❌ Reject edit request error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500