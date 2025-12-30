# app.py - Update the CORS configuration
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from extensions import db  # your SQLAlchemy instance

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

# ------------------------------
# Initialize Flask app
# ------------------------------
app = Flask(__name__)
app.config.from_object(Config)  # Load settings like DB URI, SECRET_KEY, etc.

# Enable session support
app.secret_key = "supersecretkey"  # Required for Flask sessions

# Enable CORS with proper headers - FIXED HERE
CORS(app, 
     origins=["http://localhost:3000", "http://localhost:3001"], 
     supports_credentials=True,
     methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"],
     expose_headers=["Content-Type", "Authorization"])

# Initialize database
db.init_app(app)

# ------------------------------
# Upload folder route
# ------------------------------
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    """Serve uploaded images by filename."""
    return send_from_directory(UPLOAD_FOLDER, filename)

# ------------------------------
# Register Blueprints
# ------------------------------
app.register_blueprint(auth_bp, url_prefix="/auth")        # /auth/login, /auth/signup
app.register_blueprint(farmer_bp, url_prefix="/farmer")    # /farmer/add-product, /farmer/products, etc.
app.register_blueprint(report_bp)                          # /reports
app.register_blueprint(consumer_bp, url_prefix="/consumer")
app.register_blueprint(order_bp, url_prefix="/orders")
app.register_blueprint(recommend_bp, url_prefix="/recommend")
app.register_blueprint(products_bp, url_prefix="/products")
app.register_blueprint(cart_bp, url_prefix="/cart")
app.register_blueprint(notifications_bp, url_prefix="/notifications")
app.register_blueprint(messages_bp, url_prefix="/messages")

app.register_blueprint(simple_bp, url_prefix="/simple")


# ------------------------------
# Run app
# ------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()  # Create tables if not exist (SQLAlchemy)
    app.run(debug=True, port=5001)