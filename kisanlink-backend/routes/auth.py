from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from db import get_db_connection
import re
import secrets
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

location_coords = {
    "Naya Thimi": (27.6943, 85.3347),
    "Gatthaghar": (27.6739136, 85.3739132),
    "Kausaltar": (27.6745787, 85.3642978),
    "Lokanthali": (27.6740, 85.3450),
}

# ------------------------------
# SIGNUP (Auto-verified)
# ------------------------------
@auth_bp.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        fullname = data.get("fullname", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        location = data.get("location", "")
        user_type = data.get("user_type", "")

        if not all([fullname, email, password, location, user_type]):
            return jsonify({"error": "All fields are required"}), 400
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400
        if location not in location_coords:
            return jsonify({"error": "Invalid location"}), 400
        if user_type not in ["farmer", "consumer"]:
            return jsonify({"error": "Invalid user type"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Email already registered"}), 400

        hashed_pw = generate_password_hash(password)
        lat, lon = location_coords[location]
        verification_token = secrets.token_hex(32)

        cur.execute("""
            INSERT INTO users (fullname, email, password_hash, location, latitude, longitude, user_type, verification_token, is_email_verified, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, TRUE, %s)
            RETURNING id;
        """, (fullname, email, hashed_pw, location, lat, lon, user_type, verification_token, datetime.utcnow()))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Account created successfully!",
            "user_id": user_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------------
# LOGIN (Returns JWT token)
# ------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, fullname, password_hash, user_type, is_active, is_email_verified 
            FROM users WHERE email = %s
        """, (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        user_id, fullname, hashed_password, user_type, is_active, is_email_verified = user

        if not check_password_hash(hashed_password, password):
            return jsonify({"error": "Invalid credentials"}), 401

        if not is_active or not is_email_verified:
            return jsonify({"error": "Account inactive or unverified"}), 403

        # Create JWT token
        access_token = create_access_token(identity=str(user_id))

        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": user_id,
                "fullname": fullname,
                "email": email,
                "user_type": user_type
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------------
# ME (protected with JWT)
# ------------------------------
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    try:
        user_id = get_jwt_identity()
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, fullname, email, user_type FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return jsonify({"authenticated": False}), 401

        return jsonify({
            "authenticated": True,
            "id": user[0],
            "fullname": user[1],
            "email": user[2],
            "user_type": user[3]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ------------------------------
# LOGOUT
# ------------------------------
@auth_bp.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out"}), 200