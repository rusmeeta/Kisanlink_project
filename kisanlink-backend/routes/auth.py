# -----------------------------
# routes/auth.py - COMPLETE (SECURE VERSION)
# -----------------------------

from flask import Blueprint, request, jsonify, session
from db import get_db_connection
import re
from werkzeug.security import generate_password_hash, check_password_hash

# -----------------------------
# Create Blueprint
# -----------------------------
auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

# -----------------------------
# Predefined location coordinates
# -----------------------------
location_coords = {
    "Naya Thimi": (27.6943, 85.3347),
    "Gatthaghar": (27.6739136, 85.3739132),
    "Kausaltar": (27.6745787, 85.3642978),
    "Lokanthali": (27.6740, 85.3450),
}

# -----------------------------
# Validators
# -----------------------------
def is_valid_email(email):
    pattern = r"^[a-zA-Z0-9._%+-]{3,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email)


def is_strong_password(password):
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$"
    return re.match(pattern, password)

# -----------------------------
# SIGNUP API
# -----------------------------
@auth_bp.route("/signup", methods=["POST"])
def signup_api():
    data = request.get_json()

    fullname = data.get("fullname")
    email = data.get("email")
    password = data.get("password")
    location = data.get("location")
    user_type = data.get("user_type")

    # Validate input
    if not all([fullname, email, password, location, user_type]):
        return jsonify({"status": "error", "message": "All fields are required"}), 400

    # Email validation
    if not is_valid_email(email):
        return jsonify({
            "status": "error",
            "message": "Invalid email format"
        }), 400

    # Password validation
    if not is_strong_password(password):
        return jsonify({
            "status": "error",
            "message": "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
        }), 400

    latitude, longitude = location_coords.get(location, (None, None))

    conn = get_db_connection()
    cur = conn.cursor()

    # Check duplicate email
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"status": "error", "message": "Email already exists"}), 400

    # Hash password
    hashed_password = generate_password_hash(password)

    # Insert user
    cur.execute("""
        INSERT INTO users (fullname, email, password_hash, location, user_type, latitude, longitude)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (fullname, email, hashed_password, location, user_type, latitude, longitude))

    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "status": "success",
        "message": "Signup successful",
        "user_id": user_id
    }), 201

# -----------------------------
# LOGIN API
# -----------------------------
@auth_bp.route("/login", methods=["POST"])
def login_api():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, password_hash, user_type, fullname FROM users WHERE email=%s",
        (email,)
    )
    user = cur.fetchone()

    if not user:
        cur.close()
        conn.close()
        return jsonify({"status": "error", "message": "Email not found"}), 404

    user_id, db_password, user_type, fullname = user

    # Secure password check
    if not check_password_hash(db_password, password):
        cur.close()
        conn.close()
        return jsonify({"status": "error", "message": "Incorrect password"}), 401

    session["user_id"] = user_id
    session["user_type"] = user_type

    cur.close()
    conn.close()

    return jsonify({
        "status": "success",
        "message": "Logged in successfully",
        "user_id": user_id,
        "user_type": user_type,
        "fullname": fullname
    }), 200

# -----------------------------
# LOGOUT API
# -----------------------------
@auth_bp.route("/logout", methods=["POST"])
def logout_api():
    session.clear()
    return jsonify({"status": "success", "message": "Logged out successfully"}), 200

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
        SELECT id, fullname, email, user_type, location, latitude, longitude
        FROM users WHERE id=%s
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
        "latitude": user[5],
        "longitude": user[6]
    })

# -----------------------------
# GET USER BY ID (Public)
# -----------------------------
@auth_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user_by_id(user_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, fullname, email, user_type, location, latitude, longitude
        FROM users WHERE id=%s
    """, (user_id,))

    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    return jsonify({
        "status": "success",
        "id": user[0],
        "fullname": user[1],
        "email": user[2],
        "user_type": user[3],
        "location": user[4],
        "latitude": user[5],
        "longitude": user[6]
    })

# -----------------------------
# GET ALL USERS
# -----------------------------
@auth_bp.route("/users", methods=["GET"])
def get_all_users():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, fullname, email, user_type, location
        FROM users ORDER BY id
    """)

    users = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify({
        "status": "success",
        "users": [
            {
                "id": u[0],
                "fullname": u[1],
                "email": u[2],
                "user_type": u[3],
                "location": u[4]
            } for u in users
        ],
        "count": len(users)
    })

# -----------------------------
# UPDATE PROFILE
# -----------------------------
@auth_bp.route("/update-profile", methods=["PUT"])
def update_profile():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    data = request.get_json()
    fullname = data.get("fullname")
    location = data.get("location")

    if not fullname or not location:
        return jsonify({"status": "error", "message": "Fullname and location are required"}), 400

    latitude, longitude = location_coords.get(location, (None, None))

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE users
        SET fullname=%s, location=%s, latitude=%s, longitude=%s
        WHERE id=%s
    """, (fullname, location, latitude, longitude, session["user_id"]))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"status": "success", "message": "Profile updated successfully"})

# -----------------------------
# TEST ENDPOINT
# -----------------------------
@auth_bp.route("/test", methods=["GET"])
def test_auth():
    return jsonify({
        "status": "success",
        "message": "Auth endpoints are working"
    })
