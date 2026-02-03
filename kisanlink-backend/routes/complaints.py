# File: backend/routes/complaints.py
from flask import Blueprint, request, jsonify, session
from db import get_db_connection

complaints_bp = Blueprint('complaints', __name__)

# ==================== 1. SUBMIT COMPLAINT ====================
@complaints_bp.route('/submit', methods=['POST'])
def submit_complaint():
    """Store complaint in user_complaints table"""
    try:
        user_id = session.get('user_id')
        user_type = session.get('user_type', 'consumer')
        
        if not user_id:
            return jsonify({"error": "Not logged in"}), 401
        
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        complaint_text = data.get('complaint_text', '').strip()
        if not complaint_text:
            return jsonify({"error": "Please write your complaint"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Store in user_complaints table
        cur.execute("""
            INSERT INTO user_complaints 
            (user_id, user_type, complaint_text, status)
            VALUES (%s, %s, %s, 'pending')
            RETURNING id, created_at
        """, (user_id, user_type, complaint_text))
        
        result = cur.fetchone()
        complaint_id, created_at = result
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Complaint sent to admin",
            "complaint_id": complaint_id,
            "created_at": created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    except Exception as e:
        print(f"Error in submit_complaint: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ==================== 2. GET USER'S OWN COMPLAINTS ====================
@complaints_bp.route('/my-complaints', methods=['GET'])
def get_user_complaints():
    """Get all complaints submitted by the logged-in user"""
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({"error": "Not logged in"}), 401
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Fetch user's complaints
        cur.execute("""
            SELECT 
                id, 
                complaint_text, 
                status, 
                admin_reply,
                created_at,
                updated_at
            FROM user_complaints 
            WHERE user_id = %s 
            ORDER BY created_at DESC
        """, (user_id,))
        
        complaints = []
        rows = cur.fetchall()
        
        for row in rows:
            complaints.append({
                "id": row[0],
                "complaint_text": row[1],
                "status": row[2],
                "admin_reply": row[3],
                "created_at": row[4].strftime("%Y-%m-%d %H:%M") if row[4] else None,
                "updated_at": row[5].strftime("%Y-%m-%d %H:%M") if row[5] else None
            })
        
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "complaints": complaints,
            "count": len(complaints),
            "user_id": user_id
        })
        
    except Exception as e:
        print(f"Error in get_user_complaints: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ==================== 3. ADMIN: GET ALL COMPLAINTS ====================
# ==================== 3. ADMIN: GET ALL COMPLAINTS ====================
@complaints_bp.route('/admin/all', methods=['GET'])
def get_all_complaints():
    """Admin fetches all complaints from user_complaints table"""
    try:
        # Debug session
        print("=" * 80)
        print("COMPLAINTS ENDPOINT - SESSION DEBUG:")
        for key, value in session.items():
            print(f"  {key}: {value}")
        print("=" * 80)
        
        # Check admin access using multiple methods
        is_admin = False
        admin_user_id = None
        
        # Method 1: Check if admin_id exists and admin_logged_in is True
        if session.get('admin_id') and session.get('admin_logged_in'):
            is_admin = True
            admin_user_id = session.get('admin_id')
            print(f"DEBUG: Method 1 - admin_id: {admin_user_id}")
        
        # Method 2: Check if user_type is 'admin'
        elif session.get('user_type') == 'admin':
            is_admin = True
            admin_user_id = session.get('user_id')
            print(f"DEBUG: Method 2 - user_id: {admin_user_id}, user_type: admin")
        
        # Method 3: Check database for admin status
        else:
            user_id = session.get('user_id')
            if user_id:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("SELECT user_type FROM users WHERE id = %s", (user_id,))
                result = cur.fetchone()
                cur.close()
                conn.close()
                
                if result and result[0] == 'admin':
                    is_admin = True
                    admin_user_id = user_id
                    print(f"DEBUG: Method 3 - Database confirms user {user_id} is admin")
        
        if not is_admin:
            print("DEBUG: Access denied - not admin")
            return jsonify({
                "success": False,
                "error": "Admin access required",
                "debug": {
                    "admin_id": session.get('admin_id'),
                    "user_id": session.get('user_id'),
                    "user_type": session.get('user_type'),
                    "admin_logged_in": session.get('admin_logged_in')
                }
            }), 403
        
        print(f"DEBUG: Admin access granted (user_id: {admin_user_id})")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get complaints with user info
        cur.execute("""
            SELECT 
                uc.id,
                uc.user_id,
                uc.user_type,
                uc.complaint_text,
                uc.status,
                uc.admin_reply,
                uc.created_at,
                uc.updated_at,
                u.fullname,
                u.email
            FROM user_complaints uc
            LEFT JOIN users u ON uc.user_id = u.id
            ORDER BY uc.created_at DESC
        """)
        
        rows = cur.fetchall()
        print(f"DEBUG: Found {len(rows)} complaints")
        
        complaints = []
        for row in rows:
            complaints.append({
                "id": row[0],
                "user_id": row[1],
                "user_type": row[2],
                "complaint_text": row[3],
                "status": row[4],
                "admin_reply": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "updated_at": row[7].isoformat() if row[7] else None,
                "user_name": row[8] or f"User {row[1]}",
                "user_email": row[9] or "No email"
            })
        
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "complaints": complaints,
            "count": len(complaints)
        })
        
    except Exception as e:
        print(f"ERROR in get_all_complaints: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "message": str(e)
        }), 500
# ==================== 4. ADMIN: UPDATE COMPLAINT ====================
# ==================== 4. ADMIN: UPDATE COMPLAINT ====================
@complaints_bp.route('/admin/update/<int:complaint_id>', methods=['PUT'])
def update_complaint(complaint_id):
    """Admin updates complaint status and adds reply"""
    try:
        # Check admin access using same logic
        is_admin = False
        
        # Method 1: Check if admin_id exists and admin_logged_in is True
        if session.get('admin_id') and session.get('admin_logged_in'):
            is_admin = True
        
        # Method 2: Check if user_type is 'admin'
        elif session.get('user_type') == 'admin':
            is_admin = True
        
        # Method 3: Check database for admin status
        else:
            user_id = session.get('user_id')
            if user_id:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("SELECT user_type FROM users WHERE id = %s", (user_id,))
                result = cur.fetchone()
                cur.close()
                conn.close()
                
                if result and result[0] == 'admin':
                    is_admin = True
        
        if not is_admin:
            return jsonify({"success": False, "error": "Admin access required"}), 403
        
        data = request.json
        status = data.get('status', 'pending')
        admin_reply = data.get('admin_reply', '')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update complaint
        cur.execute("""
            UPDATE user_complaints 
            SET status = %s, 
                admin_reply = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING id
        """, (status, admin_reply, complaint_id))
        
        result = cur.fetchone()
        if not result:
            cur.close()
            conn.close()
            return jsonify({"success": False, "error": "Complaint not found"}), 404
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": f"Complaint #{complaint_id} updated to '{status}'",
            "complaint_id": complaint_id
        })
        
    except Exception as e:
        print(f"Error updating complaint: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
# ==================== 5. GET COMPLAINT STATS ====================
@complaints_bp.route('/stats', methods=['GET'])
def get_complaint_stats():
    """Get complaint statistics for logged-in user"""
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({"error": "Not logged in"}), 401
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get statistics
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed
            FROM user_complaints 
            WHERE user_id = %s
        """, (user_id,))
        
        stats = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "stats": {
                "total": stats[0] or 0,
                "pending": stats[1] or 0,
                "resolved": stats[2] or 0,
                "dismissed": stats[3] or 0
            }
        })
        
    except Exception as e:
        print(f"Error getting stats: {e}")
        return jsonify({"error": str(e)}), 500

# ==================== 6. TEST ENDPOINT ====================
@complaints_bp.route('/test', methods=['GET'])
def test():
    """Test if complaints system is working"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT COUNT(*) FROM user_complaints")
        count = cur.fetchone()[0]
        
        return jsonify({
            "status": "working",
            "table": "user_complaints",
            "total_complaints": count,
            "endpoints": {
                "submit": "POST /complaints/submit",
                "my_complaints": "GET /complaints/my-complaints",
                "admin_all": "GET /complaints/admin/all",
                "admin_update": "PUT /complaints/admin/update/<id>",
                "stats": "GET /complaints/stats"
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ==================== 7. SIMPLE TEST ENDPOINT ====================
@complaints_bp.route('/simple-test', methods=['GET'])
def simple_test():
    """Simple test endpoint without auth check"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Just get complaints without user info
        cur.execute("""
            SELECT id, complaint_text, status, user_type, created_at
            FROM user_complaints 
            ORDER BY created_at DESC
        """)
        
        rows = cur.fetchall()
        print(f"SIMPLE TEST: Found {len(rows)} complaints")
        
        complaints = []
        for row in rows:
            complaints.append({
                "id": row[0],
                "complaint_text": row[1],
                "status": row[2],
                "user_type": row[3],
                "created_at": row[4].strftime("%Y-%m-%d %H:%M:%S") if row[4] else None
            })
        
        cur.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": f"Found {len(complaints)} complaints",
            "complaints": complaints,
            "count": len(complaints)
        })
        
    except Exception as e:
        print(f"Error in simple test: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
    
# ==================== 7. TEMPORARY ADMIN SESSION ====================
@complaints_bp.route('/set-admin-session', methods=['GET'])
def set_admin_session():
    """Temporary endpoint to set admin session for testing"""
    try:
        # Set admin session
        session['admin_id'] = 1
        session['admin_name'] = 'Test Admin'
        session['user_type'] = 'admin'  # Also set user_type for compatibility
        
        return jsonify({
            "success": True,
            "message": "Admin session set",
            "session": {
                "admin_id": session.get('admin_id'),
                "admin_name": session.get('admin_name'),
                "user_type": session.get('user_type')
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ==================== 7. DEBUG SESSION ====================
@complaints_bp.route('/debug-session', methods=['GET'])
def debug_session():
    """Debug endpoint to check session data"""
    session_data = dict(session)
    return jsonify({
        "success": True,
        "session": session_data,
        "has_user_id": 'user_id' in session,
        "user_id": session.get('user_id'),
        "user_type": session.get('user_type')
    })

# ==================== 8. SYNC SESSION ====================
@complaints_bp.route('/sync-session', methods=['GET'])
def sync_session():
    """Sync session data between admin and complaints endpoints"""
    try:
        # Copy admin session data to user session data
        if session.get('admin_id'):
            session['user_id'] = session['admin_id']
            session['user_type'] = 'admin'
            print(f"DEBUG: Synced session - user_id: {session['user_id']}, user_type: admin")
        
        return jsonify({
            "success": True,
            "message": "Session synced",
            "session": dict(session)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500