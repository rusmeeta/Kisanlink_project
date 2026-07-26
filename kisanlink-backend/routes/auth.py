# routes/auth.py - FINAL PRODUCTION COMPATIBLE VERSION
from flask import Blueprint, request, jsonify, session
from db import get_db_connection
import re
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# Import email service fallback wrapper
from utils.email_service import email_service

location_coords = {
    "Naya Thimi": (27.6943, 85.3347),
    "Gatthaghar": (27.6739136, 85.3739132),
    "Kausaltar": (27.6745787, 85.3642978),
    "Lokanthali": (27.6740, 85.3450),
}

# -----------------------------
# SIGNUP - Auto-Verified for Cloud Production Deployment
# -----------------------------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Signup with forced account auto-activation to bypass Render's SMTP port firewalls"""
    try:
        data = request.get_json()
        
        # Get fields
        fullname = data.get("fullname", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        location = data.get("location", "")
        user_type = data.get("user_type", "")
        
        # Validate input parameters
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
        
        # Email format validation
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Password parameter constraints check
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        
        if location not in location_coords:
            return jsonify({"error": "Please select a valid location"}), 400
        
        if user_type not in ["farmer", "consumer"]:
            return jsonify({"error": "Please select farmer or consumer"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            # Check if email account already exists in database schemas
            cur.execute("SELECT id, is_email_verified FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()
            
            if existing:
                return jsonify({"error": "Email already registered. Please login directly."}), 400
            
            # Hash password strings
            hashed_pw = generate_password_hash(password)
            lat, lon = location_coords[location]
            verification_token = secrets.token_hex(32)
            
            # Note: We match the column name to password_hash here to avoid errors
            insert_query = """
                INSERT INTO users (
                    fullname, email, password_hash, location, latitude, longitude, 
                    user_type, verification_token, is_email_verified, is_active, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, TRUE, %s)
                RETURNING id;
            """
            
            cur.execute(insert_query, (
                fullname, email, hashed_pw, location, lat, lon, 
                user_type, verification_token, datetime.utcnow()
            ))
            
            new_user_id = cur.fetchone()
            conn.commit()
            
            return jsonify({
                "message": "Account created successfully! Auto-verified for cloud production access.",
                "user_id": new_user_id,
                "auto_verified": True
            }), 201
            
        except Exception as query_err:
            conn.rollback()
            return jsonify({"error": f"Database processing failure: {str(query_err)}"}), 500
        finally:
            cur.close()
            conn.close()
            
    except Exception as server_err:
        return jsonify({"error": f"Internal routing server breakdown: {str(server_err)}"}), 500


# -----------------------------
# LOGIN - Production Compatible Route mapping
# -----------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate profiles and assign session parameters"""
    try:
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
            
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            # Fixed column target from 'password' to 'password_hash' to align with postgres schemas
            cur.execute("""
                SELECT id, fullname, password_hash, user_type, is_active, is_email_verified 
                FROM users WHERE email = %s
            """, (email,))
            user = cur.fetchone()
            
            if not user:
                return jsonify({"error": "Invalid email or password"}), 401
                
            user_id, fullname, hashed_password, user_type, is_active, is_email_verified = user
            
            if not check_password_hash(hashed_password, password):
                return jsonify({"error": "Invalid email or password"}), 401
                
            # Verify status tags
            if not is_active or not is_email_verified:
                return jsonify({"error": "Profile account is inactive or unverified."}), 403
                
            # Establish session variables mappings
            session["user_id"] = user_id
            session["fullname"] = fullname
            session["user_type"] = user_type
            
            return jsonify({
                "message": "Login successful",
                "user": {
                    "id": user_id,
                    "fullname": fullname,
                    "email": email,
                    "user_type": user_type
                }
            }), 200
            
        except Exception as login_query_err:
            return jsonify({"error": f"Login query block mismatch: {str(login_query_err)}"}), 500
        finally:
            cur.close()
            conn.close()
            
    except Exception as login_server_err:
        return jsonify({"error": f"Login initialization processing failure: {str(login_server_err)}"}), 500


# -----------------------------
# ME - Check current session / who is logged in
# -----------------------------
@auth_bp.route("/me", methods=["GET"])
def me():
    """Return the currently logged-in user based on the session cookie"""
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"authenticated": False}), 200

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, fullname, email, user_type
            FROM users WHERE id = %s
        """, (user_id,))
        user = cur.fetchone()

        if not user:
            session.clear()
            return jsonify({"authenticated": False}), 200

        user_id, fullname, email, user_type = user
        return jsonify({
            "authenticated": True,
            "id": user_id,
            "fullname": fullname,
            "email": email,
            "user_type": user_type
        }), 200
    except Exception as me_err:
        return jsonify({"error": f"Session check failure: {str(me_err)}"}), 500
    finally:
        cur.close()
        conn.close()


# -----------------------------
# LOGOUT - Clear session
# -----------------------------
@auth_bp.route("/logout", methods=["POST"])
def logout():
    """Clear the session cookie"""
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200