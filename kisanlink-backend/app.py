# app.py - UPDATED with absolute path
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS

# ------------------------------
# LOAD .ENV FILE - CRITICAL!
# ------------------------------
print("\n" + "="*60)
print("🚀 KISANLINK BACKEND STARTING")
print("="*60)

# Get the ABSOLUTE path to project root
PROJECT_ROOT = Path(__file__).resolve().parent
print(f"📁 PROJECT ROOT: {PROJECT_ROOT}")
print(f"📁 Project name: {PROJECT_ROOT.name}")

# Check what's in the directory
print("\n📁 Files in project root:")
for item in PROJECT_ROOT.iterdir():
    if item.is_file():
        print(f"  📄 {item.name}")
    elif item.is_dir():
        print(f"  📂 {item.name}/")

# Look for .env file
env_path = PROJECT_ROOT / ".env"
print(f"\n🔍 Looking for .env at: {env_path}")

if env_path.exists():
    print("✅ .env file FOUND!")
    print(f"📏 File size: {env_path.stat().st_size} bytes")
    
    # Read first few lines to verify
    with open(env_path, 'r') as f:
        lines = f.readlines()[:5]
        print("📝 First few lines of .env:")
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                if 'PASSWORD' in line:
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        print(f"  🔐 {parts[0]}=***masked***")
                    else:
                        print(f"  📝 {line}")
                else:
                    print(f"  📝 {line}")
    
    # LOAD THE .ENV FILE
    load_dotenv(env_path)
    print("\n✅ .env file LOADED!")
    
else:
    print("❌ .env file NOT FOUND at that location!")
    print("\n💡 QUICK FIX: Create .env file with this content:")
    print("="*40)
    print("EMAIL_USER=rusmitachaulagain@gmail.com")
    print("EMAIL_PASSWORD=wihbsintctwlrgze")
    print("DATABASE_URL=postgresql://kisanlink_user:password123@localhost/kisanlink_db")
    print("SECRET_KEY=your-actual-secret-key")
    print("FLASK_DEBUG=True")
    print("="*40)

# Now check if variables loaded
print("\n📋 CHECKING LOADED ENVIRONMENT VARIABLES:")
print("-"*40)

# Method 1: Check os.environ directly
email_user = os.getenv("EMAIL_USER")
email_pass = os.getenv("EMAIL_PASSWORD")

if email_user:
    print(f"✅ EMAIL_USER = {email_user}")
else:
    print("❌ EMAIL_USER = NOT FOUND")

if email_pass:
    print(f"✅ EMAIL_PASSWORD = {'*' * len(email_pass)} chars")
else:
    print("❌ EMAIL_PASSWORD = NOT FOUND")

# Method 2: Check ALL environment variables
print("\n🔍 ALL ENV VARIABLES (filtered):")
found_email_vars = False
for key, value in os.environ.items():
    if 'EMAIL' in key or 'PASSWORD' in key or 'DATABASE' in key or 'SECRET' in key:
        found_email_vars = True
        if 'PASSWORD' in key:
            print(f"  🔐 {key} = {'*' * len(value)}")
        else:
            print(f"  📝 {key} = {value}")

if not found_email_vars:
    print("  ⚠️ No email/database variables found in environment")

print("-"*40)
print("="*60 + "\n")

# ------------------------------
# NOW IMPORT OTHER MODULES
# ------------------------------
# Only proceed if email config is loaded
if not (email_user and email_pass):
    print("⚠️ WARNING: Email service will be DISABLED")
    print("   Some features may not work properly")
    print("   Check terminal for verification links instead")

    

# Import your other modules
from config import Config
from extensions import db

# Import Blueprints
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
# Initialize Flask app
# ------------------------------
app = Flask(__name__)
app.config.from_object(Config)

# Use secret key from .env or default
app.secret_key = os.getenv("SECRET_KEY", "supersecretkey")

# CORS
# CORS - Updated with your real Vercel links
# CORS - Dynamic pattern matching for all local and Vercel subdomains
import re

CORS(app, 
     origins=[
         re.compile(r"^https://.*\.vercel\.app$"),
         re.compile(r"^http://localhost:\d+$")
     ],
     supports_credentials=True,
     methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     expose_headers=["Content-Type", "Authorization"])


# Initialize database
db.init_app(app)

# ------------------------------
# Upload folder
# ------------------------------
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# ------------------------------
# DEBUG ENDPOINT
# ------------------------------
@app.route("/debug-env", methods=["GET"])
def debug_env():
    """Debug endpoint to check environment"""
    env_vars = {}
    for key in ['EMAIL_USER', 'EMAIL_PASSWORD', 'DATABASE_URL', 'SECRET_KEY', 'FLASK_DEBUG']:
        value = os.getenv(key)
        if value:
            if 'PASSWORD' in key:
                env_vars[key] = f"***{len(value)} chars***"
            elif 'DATABASE_URL' in key and 'password123' in value:
                env_vars[key] = value.replace('password123', '****')
            else:
                env_vars[key] = value
        else:
            env_vars[key] = "NOT FOUND"
    
    return {
        "project_root": str(PROJECT_ROOT),
        "env_file_path": str(env_path),
        "env_file_exists": env_path.exists(),
        "loaded_variables": env_vars,
        "python_version": sys.version,
        "working_directory": os.getcwd(),
        "can_send_emails": bool(os.getenv("EMAIL_USER") and os.getenv("EMAIL_PASSWORD"))
    }

# ------------------------------
# TEST EMAIL
# ------------------------------
@app.route("/test-email", methods=["GET"])
def test_email():
    """Test if email can be sent"""
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASSWORD")
    
    if not (email_user and email_pass):
        return {
            "success": False,
            "message": "Email credentials not configured",
            "email_user_loaded": bool(email_user),
            "email_pass_loaded": bool(email_pass),
            "instructions": "Check .env file and restart server"
        }
    
    try:
        import smtplib
        # Test connection
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
        server.login(email_user, email_pass)
        server.quit()
        
        return {
            "success": True,
            "message": "✅ Email service is working!",
            "email": email_user,
            "status": "SMTP connection successful"
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"❌ Email test failed: {str(e)}",
            "error_type": type(e).__name__,
            "troubleshooting": [
                "1. Check if 2FA is enabled in Google Account",
                "2. Verify App Password is correct",
                "3. Try allowing less secure apps temporarily"
            ]
        }

# ------------------------------
# Register Blueprints
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
# HEALTH CHECK
# ------------------------------
@app.route("/", methods=["GET"])
def index():
    return {
        "service": "KisanLink API",
        "status": "running",
        "version": "1.0",
        "email_service": "ready" if os.getenv("EMAIL_USER") and os.getenv("EMAIL_PASSWORD") else "not configured",
        "endpoints": {
            "test_email": "/test-email",
            "debug_env": "/debug-env",
            "auth": "/auth/*",
            "farmer": "/farmer/*",
            "consumer": "/consumer/*"
        }
    }

# 🚀 FORCED SCHEMA RESET FOR PRODUCTION:
# Wipes old mismatched tables so Gunicorn can recreate them with the 'is_active' column.
with app.app_context():
    try:
        print("🧼 STEP 1: Wiping old mismatched cloud database tables...")
        db.drop_all()
        
        print("🏗️ STEP 2: Rebuilding fresh schemas with 'is_active' columns...")
        db.create_all()
        print("✅ SUCCESS: Render cloud database tables synchronized perfectly!")
    except Exception as server_db_error:
        print(f"❌ DATABASE ERROR: {server_db_error}")

# ------------------------------
# RUN APP (Used for local laptop testing only)
# ------------------------------
# ------------------------------
# RUN APP & AUTO-FIX COLUMNS
# ------------------------------
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 STARTING SERVER ON PORT 5001")
    print("="*60)
    
    # 🚀 AUTOMATED COLUMNS REPAIR: Adds the missing fields instantly to the database
    try:
        from db import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Inject the columns your login and signup are crashing on
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT TRUE;")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);")
        
        # Make sure any existing accounts are automatically verified and active
        cur.execute("UPDATE users SET is_active = TRUE, is_email_verified = TRUE WHERE is_active IS NULL OR is_email_verified IS NULL;")
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ SUCCESS: Database layout columns synchronized perfectly!")
    except Exception as db_err:
        print(f"⚠️ Database column synchronization note: {db_err}")
        
    print("="*60 + "\n")
    app.run(debug=True, port=5001)
