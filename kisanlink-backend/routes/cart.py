from flask import Blueprint, request, jsonify, session
from extensions import db
from models_cart import CartItem
from models_farmer_items import FarmerItem
from models_user import User
from models_notification import Notification
from models_order import Order, OrderItem

cart_bp = Blueprint("cart", __name__)

DELIVERY_PER_FARMER = 50

# Helper: get full cart for consumer
def get_cart_for_consumer(consumer_id):
    items = (
        db.session.query(
            CartItem.id.label("cart_id"),
            CartItem.product_id,
            CartItem.quantity,
            FarmerItem.item_name,
            FarmerItem.price,
            FarmerItem.available_stock,
            FarmerItem.min_order_qty,
            FarmerItem.photo_path,
            User.fullname.label("farmer_name"),
        )
        .join(FarmerItem, CartItem.product_id == FarmerItem.id)
        .join(User, FarmerItem.farmer_id == User.id)
        .filter(CartItem.consumer_id == consumer_id)
        .all()
    )
    return [
        {
            "id": i.cart_id,
            "product_id": i.product_id,
            "item_name": i.item_name,
            "farmer_name": i.farmer_name or "Unknown",
            "price": float(i.price),
            "available_stock": i.available_stock,
            "min_order_qty": i.min_order_qty,
            "quantity": i.quantity,
            "photo_path": i.photo_path,
        }
        for i in items
    ]

# -----------------------------
# GET cart items
# -----------------------------
@cart_bp.route("/", methods=["GET"])
def get_cart_items():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    consumer_id = session["user_id"]
    cart_data = get_cart_for_consumer(consumer_id)
    return jsonify(cart_data)

# -----------------------------
# ADD item to cart
# -----------------------------
@cart_bp.route("/", methods=["POST"])
def add_to_cart():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    data = request.get_json()
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    consumer_id = session["user_id"]

    if not product_id:
        return jsonify({"status": "error", "message": "Product ID is required"}), 400

    product = FarmerItem.query.get(product_id)
    if not product:
        return jsonify({"status": "error", "message": "Product not found"}), 404

    if quantity < product.min_order_qty or quantity > product.available_stock:
        return jsonify({
            "status": "error",
            "message": f"Quantity must be between {product.min_order_qty} and {product.available_stock}"
        }), 400

    item = CartItem.query.filter_by(consumer_id=consumer_id, product_id=product_id).first()
    if item:
        new_qty = item.quantity + quantity
        if new_qty > product.available_stock:
            return jsonify({
                "status": "error",
                "message": f"Cannot exceed available stock ({product.available_stock})"
            }), 400
        item.quantity = new_qty
    else:
        item = CartItem(consumer_id=consumer_id, product_id=product_id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    cart_data = get_cart_for_consumer(consumer_id)
    return jsonify({"status": "success", "cart": cart_data})

# -----------------------------
# UPDATE quantity
# -----------------------------
@cart_bp.route("/<int:item_id>", methods=["PUT"])
def update_cart_item(item_id):
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    data = request.get_json()
    quantity = data.get("quantity")
    if quantity is None:
        return jsonify({"status": "error", "message": "Quantity is required"}), 400

    item = CartItem.query.get(item_id)
    if not item or item.consumer_id != session["user_id"]:
        return jsonify({"status": "error", "message": "Item not found"}), 404

    product = FarmerItem.query.get(item.product_id)
    if quantity < product.min_order_qty or quantity > product.available_stock:
        return jsonify({
            "status": "error",
            "message": f"Quantity must be between {product.min_order_qty} and {product.available_stock}"
        }), 400

    item.quantity = quantity
    db.session.commit()

    cart_data = get_cart_for_consumer(item.consumer_id)
    return jsonify({"status": "success", "cart": cart_data})

# -----------------------------
# REMOVE item
# -----------------------------
@cart_bp.route("/<int:item_id>", methods=["DELETE"])
def remove_cart_item(item_id):
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    item = CartItem.query.get(item_id)
    if not item or item.consumer_id != session["user_id"]:
        return jsonify({"status": "error", "message": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    cart_data = get_cart_for_consumer(session["user_id"])
    return jsonify({"status": "success", "cart": cart_data})

print("🔥 CHECKOUT ROUTE HIT")


# -----------------------------
# CHECKOUT
# -----------------------------
from models_order import Order  # Make sure this is your Order model

@cart_bp.route("/checkout", methods=["POST"])
def checkout():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    consumer_id = session["user_id"]
    data = request.get_json()
    item_ids = data.get("item_ids", [])

    if not item_ids:
        return jsonify({"status": "error", "message": "No items selected"}), 400

    try:
        # Fetch selected cart items with farmer info
        items = (
            db.session.query(
                CartItem.id.label("cart_id"),
                CartItem.quantity,
                FarmerItem.id.label("item_id"),
                FarmerItem.item_name,
                FarmerItem.price,
                User.fullname.label("farmer_name"),
                User.id.label("farmer_id")
            )
            .join(FarmerItem, CartItem.product_id == FarmerItem.id)
            .join(User, FarmerItem.farmer_id == User.id)
            .filter(CartItem.consumer_id == consumer_id, CartItem.id.in_(item_ids))
            .all()
        )

        if not items:
            return jsonify({"status": "error", "message": "No valid items found"}), 400

        order_summary = []
        order_records = []

        for i in items:
            total_price = i.quantity * i.price

            # Create order record
            order = Order(
                consumer_id=consumer_id,
                farmer_id=i.farmer_id,
                item_id=i.item_id,
                quantity=i.quantity,
                total_price=total_price,
                status="placed"
            )
            db.session.add(order)
            order_records.append(order)

            # Append to order summary for frontend modal
            order_summary.append({
                "item_name": i.item_name,
                "quantity": i.quantity,
                "price": float(i.price),
                "farmer_name": i.farmer_name
            })

        db.session.flush()  # Flush to assign IDs to orders

        # Notify farmers
        for order in order_records:
            note = Notification(
                user_id=order.farmer_id,
                message=f"{order.quantity} kg of {order_summary[0]['item_name']} has been ordered by a consumer.",
                order_id=order.id
            )
            db.session.add(note)

        # Delete ordered cart items
        CartItem.query.filter(
            CartItem.consumer_id == consumer_id,
            CartItem.id.in_(item_ids)
        ).delete(synchronize_session=False)

        # Notify consumer
        details = ", ".join([f"{i['quantity']} kg of {i['item_name']} - Rs {i['quantity']*i['price']}" for i in order_summary])
        consumer_note = Notification(
            user_id=consumer_id,
            message=f"Your order has been placed successfully: {details}",
            order_id=order_records[0].id if order_records else None
        )
        db.session.add(consumer_note)

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Your order has been placed successfully",
            "order_details": order_summary,
            "order_id": order_records[0].id if order_records else None
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": "Something went wrong during checkout"}), 500
