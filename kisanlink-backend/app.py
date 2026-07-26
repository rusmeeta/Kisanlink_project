# app.py - FINAL PRODUCTION VERSION
import os
import sys
import re
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS

# ------------------------------
# LOAD .ENV
# ------------------------------
print("\n" + "="*60)
print("🚀 KISANLINK BACKEND STARTING")
print("="*60)

PROJECT_ROOT = Path(__file__).resolve().parent
print(f"📁 PROJECT ROOT: {PROJECT_ROOT}")

env_path = PROJECT_ROOT / ".env"
if env_path.exists():
    load_dotenv(env_path)
    print("✅ .env file LOADED!")
else:
    print("❌ .env file NOT FOUND at that location!")

# ------------------------------
# IMPORT MODULES
# ------------------------------
from config import Config
from extensions import db
from routes.auth import auth_bp
from routes.farmer import farmer_bp
from routes.report import report_bp
from routes.consumer import consumer_bp
from routes.order import order_bp
from routes.recommend import recommend_bp
from routes.products import products_bp
from routes.cart import cart_bp
from routes.notifications import notifications_bp
from routes.messages import messages_bp
from routes.simple_messages import simple_bp
from routes.admin import admin_bp
from routes.complaints import complaints_bp

# ------------------------------
# INIT FLASK APP
# ------------------------------
app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = os.getenv("SECRET_KEY", "supersecretkey")

# Session config
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=True,
)

# CORS – keep for local development, but not needed for production (same domain)
CORS(app, 
     origins=[
         re.compile(r"^https://.*\.vercel\.app$"),
         re.compile(r"^http://localhost:\d+$")
     ],
     supports_credentials=True,
     methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     expose_headers=["Content-Type", "Authorization"])

# Init DB
db.init_app(app)

# Upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ------------------------------
# REGISTER BLUEPRINTS
# ------------------------------
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(farmer_bp, url_prefix="/farmer")
app.register_blueprint(report_bp)
app.register_blueprint(consumer_bp, url_prefix="/consumer")
app.register_blueprint(order_bp, url_prefix="/orders")
app.register_blueprint(recommend_bp, url_prefix="/recommend")
app.register_blueprint(products_bp, url_prefix="/products")
app.register_blueprint(cart_bp, url_prefix="/cart")
app.register_blueprint(notifications_bp, url_prefix="/notifications")
app.register_blueprint(messages_bp, url_prefix="/messages")
app.register_blueprint(simple_bp, url_prefix="/simple")
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(complaints_bp, url_prefix="/complaints")

# ------------------------------
# DATABASE SYNC (Auto-verify columns)
# ------------------------------
try:
    from db import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    print("🧹 Synchronizing missing columns...")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT TRUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);")
    cur.execute("UPDATE users SET is_active = TRUE, is_email_verified = TRUE WHERE is_active IS NULL OR is_email_verified IS NULL;")
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database sync complete.")
except Exception as e:
    print(f"⚠️ DB sync notice: {e}")

# ------------------------------
# SERVE REACT FRONTEND (Catch-all)
# ------------------------------
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    # If the path is for a static asset (like .js, .css, .png), serve it from the static folder
    if path and (path.startswith('static/') or '.' in path):
        return send_from_directory('static', path)
    # For any other route, serve index.html so React Router handles it
    return send_from_directory('static', 'index.html')

# ------------------------------
# RUN APP
# ------------------------------
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 STARTING SERVER ON PORT 5001")
    print("="*60)
    app.run(debug=True, port=5001)