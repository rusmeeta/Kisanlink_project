from flask import Blueprint, request, jsonify
from models_order import Order, OrderItem
from models_notification import Notification
from extensions import db
from models_user import User
from datetime import datetime
from models_farmer_items import FarmerItem
order_bp = Blueprint("order", __name__)


ALLOWED_TRANSITIONS = {
    "placed": ["preparing"],
    "preparing": ["ready"],
    "ready": ["delivered"]
}


# ----------------- Create Order -----------------
@order_bp.route("/create", methods=["POST"])
def create_order():
    data = request.json

    # 1️⃣ Create the order
    order = Order(consumer_id=data["consumer_id"], farmer_id=data["farmer_id"])
    db.session.add(order)
    db.session.flush()  # get order.id without commit

    # 2️⃣ Add order items
    for item in data["items"]:
        order_item = OrderItem(order_id=order.id, product_id=item["product_id"], quantity=item["quantity"])
        db.session.add(order_item)

    # 3️⃣ Add notifications
    farmer_notification = Notification(
        user_id=data["farmer_id"],
        order_id=order.id,
        message=f"New order received from consumer {data['consumer_id']} ({', '.join([str(i['quantity'])+' kg' for i in data['items']])})",
        target_role="farmer"
    )
    db.session.add(farmer_notification)

    consumer_notification = Notification(
        user_id=data["consumer_id"],
        order_id=order.id,
        message=f"Your order of {', '.join([str(i['quantity'])+' kg' for i in data['items']])} has been placed successfully.",
        target_role="consumer"
    )
    db.session.add(consumer_notification)

    db.session.commit()  # commit everything at once

    return jsonify({"message": "Order placed", "order_id": order.id})


# ----------------- Get farmer_id by order -----------------
@order_bp.route("/<int:order_id>", methods=["GET"])
def get_order_farmer(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"status": "error", "message": "Order not found"}), 404

    return jsonify({"status": "success", "farmer_id": order.farmer_id})

@order_bp.route("/farmer/<int:farmer_id>", methods=["GET"])
def get_farmer_orders(farmer_id):
    try:
        # Get orders for this farmer
        orders = Order.query.filter_by(farmer_id=farmer_id)\
            .order_by(Order.order_date.desc())\
            .all()
        
        orders_data = []
        for order in orders:
            # Get customer name
            customer = User.query.get(order.consumer_id)
            
            orders_data.append({
                "id": order.id,
                "consumer_id": order.consumer_id,
                "consumer_name": customer.fullname if customer else "Customer",
                "total_price": float(order.total_price) if order.total_price else 0,
                "status": order.status,
                "order_date": order.order_date.isoformat() if order.order_date else None
            })
        
        return jsonify({"orders": orders_data})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Update order status (SIMPLE)
@order_bp.route("/update-status", methods=["POST"])
def update_order_status():
    try:
        data = request.get_json()

        order_id = data.get("order_id")
        farmer_id = data.get("farmer_id")
        new_status = data.get("new_status")

        if not all([order_id, farmer_id, new_status]):
            return jsonify({"error": "Missing required fields"}), 400

        order = Order.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404

        if order.farmer_id != int(farmer_id):
            return jsonify({"error": "Not your order"}), 403

        # Validate status transition
        allowed = ALLOWED_TRANSITIONS.get(order.status, [])
        if new_status not in allowed:
            return jsonify({
                "error": f"Invalid status change from {order.status} to {new_status}"
            }), 400

        # Use model method
        order.update_status(new_status)

        
        db.session.commit()

        return jsonify({
            "success": True,
            "order_id": order.id,
            "new_status": order.status
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@order_bp.route("/consumer/<int:consumer_id>", methods=["GET"])
def get_consumer_orders(consumer_id):
    try:
        print(f"Fetching orders for consumer: {consumer_id}")
        
        # Get orders
        orders = (
            Order.query
            .filter_by(consumer_id=consumer_id)
            .order_by(Order.order_date.desc())
            .all()
        )
        
        result = []
        for order in orders:
            # Get farmer info
            farmer = User.query.get(order.farmer_id)
            
            # Initialize items list
            items = []
            
            # Check if order has items attribute
            if hasattr(order, 'items'):
                for oi in order.items:
                    # Try to get farmer item info if needed
                    try:
                        # Import here to avoid circular imports
                        from models_farmer_items import FarmerItem
                        farmer_item = FarmerItem.query.get(oi.product_id)
                        
                        items.append({
                            "product_id": oi.product_id,
                            "product_name": farmer_item.item_name if farmer_item else f"Item {oi.product_id}",
                            "quantity": oi.quantity,
                            "price": float(oi.price) if oi.price else 0.0
                        })
                    except Exception as e:
                        print(f"Error getting farmer item: {e}")
                        # Fallback
                        items.append({
                            "product_id": oi.product_id,
                            "product_name": f"Item {oi.product_id}",
                            "quantity": oi.quantity,
                            "price": float(oi.price) if hasattr(oi, 'price') else 0.0
                        })
            else:
                print(f"Order {order.id} has no 'items' attribute")
            
            result.append({
                "id": order.id,
                "farmer_name": farmer.fullname if farmer else "Farmer",
                "total_price": float(order.total_price or 0),
                "status": order.status,
                "order_date": order.order_date.isoformat() if order.order_date else None,
                "items": items
            })
        
        return jsonify({"orders": result}), 200
        
    except Exception as e:
        print(f"Consumer order error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500