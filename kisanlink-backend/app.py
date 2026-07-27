import os
import sys
import re
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, send_from_directory, session
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

email_user = os.getenv("EMAIL_USER")
email_pass = os.getenv("EMAIL_PASSWORD")

print(f"✅ EMAIL_USER = {email_user if email_user else 'NOT FOUND'}")
print(f"✅ EMAIL_PASSWORD = {'*' * len(email_pass) if email_pass else 'NOT FOUND'}")

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

# ---------- SESSION CONFIG (production) ----------
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='None',
)

# ---------- CORS ----------
CORS(app,
     origins=[
         "https://kisanlink-project-2d21w4tn6-rusmeetas-projects.vercel.app",
         re.compile(r"^https://.*\.vercel\.app$"),
         "http://localhost:3000",
         "http://localhost:5001"
     ],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
     allow_headers=["Content-Type", "Authorization", "Accept"])

# Init DB
db.init_app(app)

# ------------------------------
# UPLOADS
# ------------------------------
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
# DB SYNC – AUTO‑ADD MISSING COLUMNS
# ------------------------------
try:
    from db import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    print("🧹 Synchronizing columns...")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20);")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT TRUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);")
    cur.execute("UPDATE users SET is_active = TRUE, is_email_verified = TRUE WHERE is_active IS NULL OR is_email_verified IS NULL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_complaints (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            user_type VARCHAR(20) NOT NULL DEFAULT 'consumer',
            complaint_text TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            admin_reply TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    """)

    # NEW: fix missing column bug from earlier
    cur.execute("ALTER TABLE farmer_items ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;")
    conn.commit()
    cur.close()
    conn.close()
    print("✅ DB sync complete.")
except Exception as e:
    print(f"⚠️ DB sync notice: {e}")

# ------------------------------
# HEALTH CHECK
# ------------------------------
@app.route("/", methods=["GET"])
def index():
    return {
        "service": "KisanLink API",
        "status": "running",
        "version": "1.0",
        "email_service": "ready" if os.getenv("EMAIL_USER") and os.getenv("EMAIL_PASSWORD") else "not configured"
    }

@app.route("/debug-table", methods=["GET"])
def debug_table():
    from db import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='users'")
    columns = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    return {"columns": columns}
# ------------------------------
# RUN
# ------------------------------
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 STARTING SERVER ON PORT 5001")
    print("="*60)
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001)