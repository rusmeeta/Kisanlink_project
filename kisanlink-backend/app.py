import os
import re
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, verify_jwt_in_request

# Load .env
PROJECT_ROOT = Path(__file__).resolve().parent
env_path = PROJECT_ROOT / ".env"
if env_path.exists():
    load_dotenv(env_path)

app = Flask(__name__)
app.url_map.strict_slashes = False

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey')
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey')
jwt = JWTManager(app)

# ---------- CORS ----------
CORS(app,
     origins=[
         # Add your exact Vercel URL (copy from browser)
         "https://kisanlink-project-5kjkkhxet-rusmeetas-projects.vercel.app",
         re.compile(r"^https://.*\.vercel\.app$"),
         "http://localhost:3000",
         "http://localhost:5001"
     ],
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
     allow_headers=["Content-Type", "Authorization", "Accept"])

# ---------- EXPLICIT CORS HEADERS (FALLBACK) ----------
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin:
        # Allow any Vercel origin or localhost
        allowed = (
            origin.startswith('http://localhost:')
            or origin.startswith('https://kisanlink-project')
            or origin.endswith('.vercel.app')
        )
        if allowed:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    return response

# Import blueprints
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

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(farmer_bp, url_prefix='/farmer')
app.register_blueprint(report_bp)
app.register_blueprint(consumer_bp, url_prefix='/consumer')
app.register_blueprint(order_bp, url_prefix='/orders')
app.register_blueprint(recommend_bp, url_prefix='/recommend')
app.register_blueprint(products_bp, url_prefix='/products')
app.register_blueprint(cart_bp, url_prefix='/cart')
app.register_blueprint(notifications_bp, url_prefix='/notifications')
app.register_blueprint(messages_bp, url_prefix='/messages')
app.register_blueprint(simple_bp, url_prefix='/simple')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(complaints_bp, url_prefix='/complaints')

# ---------- GLOBAL JWT PROTECTION ----------
PUBLIC_ENDPOINTS = ['/auth/login', '/auth/signup', '/', '/debug-env', '/test-email', '/uploads']
@app.before_request
def jwt_global_protection():
    if request.method == 'OPTIONS':
        return
    for endpoint in PUBLIC_ENDPOINTS:
        if request.path.startswith(endpoint):
            return
    try:
        verify_jwt_in_request()
    except Exception:
        return jsonify({'error': 'Missing or invalid token'}), 401

# Uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# DB sync
try:
    from db import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT TRUE;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';")
    cur.execute("UPDATE users SET is_active = TRUE, is_email_verified = TRUE WHERE is_active IS NULL OR is_email_verified IS NULL;")
    cur.execute("ALTER TABLE farmer_items ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved';")
    conn.commit()
    cur.close()
    conn.close()
    print("✅ DB sync complete.")
except Exception as e:
    print(f"⚠️ DB sync notice: {e}")

if __name__ == '__main__':
    app.run(debug=True, port=5001)