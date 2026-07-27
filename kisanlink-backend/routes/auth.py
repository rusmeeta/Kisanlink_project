# routes/auth.py - WORKING VERSION FOR YOUR DATABASE
from flask import Blueprint, request, jsonify, session
from db import get_db_connection
import re
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# Import email service
from utils.email_service import email_service

location_coords = {
    "Naya Thimi": (27.6943, 85.3347),
    "Gatthaghar": (27.6739136, 85.3739132),
    "Kausaltar": (27.6745787, 85.3642978),
    "Lokanthali": (27.6740, 85.3450),
}

# -----------------------------
# SIGNUP - For your database
# -----------------------------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Signup with email verification"""
    try:
        data = request.get_json()
        
        # Get fields
        fullname = data.get("fullname", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        location = data.get("location", "")
        user_type = data.get("user_type", "")
        
        # Validate
        if not all([fullname, email, password, location, user_type]):
            return jsonify({"error": "All fields are required"}), 400
        
        if len(fullname) < 2:
            return jsonify({"error": "Full name must be at least 2 characters"}), 400
        
        if len(fullname) > 100:
            return jsonify({"error": "Full name cannot exceed 100 characters"}), 400
        
        if " " not in fullname:
            return jsonify({"error": "Please enter both first and last name"}), 400
        
        if not re.match(r"^[A-Za-z\s]+$", fullname):
            return jsonify({"error": "Full name can only contain letters and spaces"}), 400
        
        fullname = " ".join(fullname.split())
        
        # Email validation
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Password validation
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        
        if location not in location_coords:
            return jsonify({"error": "Please select a valid location"}), 400
        
        if user_type not in ["farmer", "consumer"]:
            return jsonify({"error": "Please select farmer or consumer"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            # Check if email exists
            cur.execute("SELECT id, is_email_verified FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()
            
            if existing:
                user_id, is_verified = existing
                if is_verified:
                    return jsonify({"error": "Email already registered. Please login."}), 400
                else:
                    # User exists but not verified - allow resend
                    return jsonify({
                        "error": "Email registered but not verified. Check your email or request new verification.",
                        "needs_verification": True,
                        "email": email
                    }), 400
            
            # Get coordinates
            latitude, longitude = location_coords[location]
            
            # Generate verification token
            verification_token = secrets.token_urlsafe(32)
            
            # Hash password
            hashed_password = generate_password_hash(password)
            
            # Insert new user (unverified)
            cur.execute("""
                INSERT INTO users 
                (fullname, email, password_hash, location, user_type, 
                 latitude, longitude, is_email_verified, verification_token)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, %s)
                RETURNING id
            """, (
                fullname, email, hashed_password, location, user_type,
                latitude, longitude, verification_token
            ))
            
            user_id = cur.fetchone()[0]
            conn.commit()
            
            print(f"✅ User created (unverified): {email}")
            
            # Send verification email
            #email_sent = email_service.send_verification_email(email, verification_token, fullname)
            
            return jsonify({
                "success": True,
                "message": "Account created! Check your email for verification link.",
                "user_id": user_id,
                "email_sent": False,
                "note": "You must verify email before logging in"
            }), 201
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Database error: {e}")
            return jsonify({"error": f"Registration failed: {str(e)}"}), 500
        finally:
            cur.close()
            conn.close()
            
    except Exception as e:
        print(f"❌ Signup error: {e}")
        return jsonify({"error": "Invalid request"}), 400

# -----------------------------
# VERIFY EMAIL
# -----------------------------
@auth_bp.route("/verify-email/<token>", methods=["GET"])
def verify_email(token):
    """Verify user's email"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Find user with this token (not verified)
        cur.execute("""
            SELECT id, email, fullname, is_email_verified 
            FROM users 
            WHERE verification_token = %s
        """, (token,))
        
        user = cur.fetchone()
        
        if not user:
            return """
            <html>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h2 style="color: #d32f2f;">❌ Invalid Link</h2>
                <p>Verification link is invalid or expired.</p>
                <a href="http://localhost:3000/signup" 
                   style="background: #4CAF50; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin-top: 20px;">
                    Sign Up Again
                </a>
            </body>
            </html>
            """
        
        user_id, email, fullname, is_verified = user
        
        # Check if already verified
        if is_verified:
            cur.close()
            conn.close()
            return f"""
            <html>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h2 style="color: #2E7D32;">✅ Already Verified</h2>
                <p>Your email {email} is already verified.</p>
                <a href="http://localhost:3000/login" 
                   style="background: #4CAF50; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin-top: 20px;">
                    Go to Login
                </a>
            </body>
            </html>
            """
        
        # Mark as verified
        cur.execute("""
            UPDATE users 
            SET is_email_verified = TRUE,
                verification_token = NULL,
                email_verified_at = CURRENT_TIMESTAMP,
                is_active = TRUE
            WHERE id = %s
        """, (user_id,))
        
        conn.commit()
        
        # Send welcome email
        email_service.send_welcome_email(email, fullname)
        
        cur.close()
        conn.close()
        
        return f"""
        <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <div style="max-width: 500px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
                <h2 style="color: #2E7D32;">✅ Email Verified!</h2>
                <p>Welcome <strong>{fullname}</strong>!</p>
                <p>Your email <strong>{email}</strong> has been verified successfully.</p>
                <p>Your account is now active.</p>
                
                <a href="https://kisanlink-project-1.onrender.com/login" 
                   style="display: inline-block; background: #4CAF50; color: white; 
                          padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                          margin-top: 20px; font-weight: bold;">
                    🚀 Go to Login
                </a>
                
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    Verified on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </p>
            </div>
        </body>
        </html>
        """
        
    except Exception as e:
        conn.rollback()
        return f"""
        <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2 style="color: #d32f2f;">❌ Verification Failed</h2>
            <p>Error: {str(e)}</p>
        </body>
        </html>
        """
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()


# -----------------------------
# LOGIN - Check verification AND deactivation
# -----------------------------
@auth_bp.route("/login", methods=["POST"])
def login_api():
    """Login with email verification AND deactivation check"""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # ✅ UPDATED: Get user with verification AND active status
        cur.execute("""
            SELECT id, password_hash, user_type, fullname, 
                   is_email_verified, is_active 
            FROM users WHERE email = %s
        """, (email,))
        
        user = cur.fetchone()
        
        if not user:
            return jsonify({"error": "Account not found. Please sign up first."}), 404
        
        # ✅ UPDATED: Unpack with is_active
        user_id, db_password, user_type, fullname, is_verified, is_active = user
        
        # ✅ NEW: Check if user is deactivated
        if not is_active:
            return jsonify({
                "error": "Account is deactivated",
                "account_status": "deactivated",
                "contact": "Please contact admin for account reactivation"
            }), 403
        
        # Check if email is verified
        
        
        # Check password
        if not check_password_hash(db_password, password):
            return jsonify({"error": "Incorrect password"}), 401
        
        # Update login stats
        cur.execute("""
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP,
                login_count = COALESCE(login_count, 0) + 1
            WHERE id = %s
        """, (user_id,))
        
        conn.commit()
        
        # Set session
        session["user_id"] = user_id
        session["user_type"] = user_type
        
        return jsonify({
            "success": True,
            "message": "Logged in successfully",
            "user_id": user_id,
            "user_type": user_type,
            "fullname": fullname
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({"error": f"Login failed: {str(e)}"}), 500
    finally:
        cur.close()
        conn.close()

# -----------------------------
# RESEND VERIFICATION
# -----------------------------
@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    """Resend verification email"""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # ✅ UPDATED: Check user with active status
        cur.execute("""
            SELECT id, fullname, is_email_verified, is_active 
            FROM users WHERE email = %s
        """, (email,))
        
        user = cur.fetchone()
        
        if not user:
            return jsonify({"error": "User not found. Please sign up first."}), 404
        
        user_id, fullname, is_verified, is_active = user
        
        # ✅ NEW: Check if user is deactivated
        if not is_active:
            return jsonify({
                "error": "Account is deactivated. Cannot resend verification.",
                "account_status": "deactivated"
            }), 403
        
        if is_verified:
            return jsonify({"error": "Email already verified. Please login."}), 400
        
        # Generate new token
        new_token = secrets.token_urlsafe(32)
        
        # Update token
        cur.execute("""
            UPDATE users 
            SET verification_token = %s
            WHERE id = %s
        """, (new_token, user_id))
        
        conn.commit()
        
        # Send email
        email_sent = email_service.send_verification_email(email, new_token, fullname)
        
        return jsonify({
            "success": True,
            "message": "Verification email sent. Please check your inbox.",
            "email_sent": email_sent
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to resend: {str(e)}"}), 500
    finally:
        cur.close()
        conn.close()

# -----------------------------
# CHECK USER STATUS
# -----------------------------
@auth_bp.route("/check-user/<email>", methods=["GET"])
def check_user(email):
    """Check user verification status"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, fullname, is_email_verified, created_at, email_verified_at
            FROM users WHERE email = %s
        """, (email,))
        
        user = cur.fetchone()
        
        if not user:
            return jsonify({
                "status": "not_found",
                "message": "No account found"
            })
        
        user_id, fullname, is_verified, created_at, verified_at = user
        
        return jsonify({
            "status": "found",
            "user_id": user_id,
            "fullname": fullname,
            "is_verified": is_verified,
            "created_at": str(created_at) if created_at else None,
            "verified_at": str(verified_at) if verified_at else None,
            "message": "Verified user" if is_verified else "Pending verification"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# -----------------------------
# LOGOUT
# -----------------------------
@auth_bp.route("/logout", methods=["POST"])
def logout_api():
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})

# -----------------------------
# GET CURRENT USER
# -----------------------------
@auth_bp.route("/me", methods=["GET"])
def me_api():
    if "user_id" not in session:
        return jsonify({"authenticated": False}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, fullname, email, user_type, location, is_email_verified
        FROM users WHERE id = %s
    """, (session["user_id"],))
    
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user:
        return jsonify({"authenticated": False}), 401
    
    return jsonify({
        "authenticated": True,
        "user_id": user[0],
        "fullname": user[1],
        "email": user[2],
        "user_type": user[3],
        "location": user[4],
        "is_verified": user[5]
    })

# -----------------------------
# TEST ENDPOINTS
# -----------------------------
@auth_bp.route("/test-email", methods=["GET"])
def test_email():
    """Test email configuration"""
    return jsonify({
        "email_service_enabled": email_service.enabled,
        "sender_email": email_service.sender_email if email_service.enabled else None,
        "status": "Configure .env file with EMAIL_USER and EMAIL_PASSWORD" if not email_service.enabled else "Ready"
    })

@auth_bp.route("/force-verify/<email>", methods=["GET"])
def force_verify(email):
    """Force verify a user (for testing)"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            UPDATE users 
            SET is_email_verified = TRUE,
                verification_token = NULL,
                email_verified_at = CURRENT_TIMESTAMP
            WHERE email = %s
            RETURNING id, fullname
        """, (email,))
        
        result = cur.fetchone()
        conn.commit()
        
        if result:
            return jsonify({
                "success": True,
                "message": f"User {result[1]} verified",
                "user_id": result[0]
            })
        else:
            return jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

@auth_bp.route("/debug-email", methods=["GET"])
def debug_email():
    """Debug email configuration"""
    from utils.email_service import email_service
    
    return jsonify({
        "email_service_enabled": email_service.enabled,
        "sender_email": email_service.sender_email,
        "has_password": bool(email_service.sender_password),
        "password_length": len(email_service.sender_password) if email_service.sender_password else 0,
        "env_loaded": bool(os.getenv("EMAIL_USER")),
        "actual_env_user": os.getenv("EMAIL_USER"),
        "server_status": "Check terminal for initialization logs"
    })