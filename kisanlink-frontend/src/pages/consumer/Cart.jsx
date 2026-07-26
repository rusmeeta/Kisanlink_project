import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DELIVERY_PER_FARMER = 50;
const BACKEND_URL = "https://kisanlink-project.onrender.com";

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [orderId, setOrderId] = useState(null);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/cart/`, { credentials: "include" });
      const data = await res.json();
      setCart(data);

      const selected = {};
      data.forEach((i) => (selected[i.id] = true));
      setSelectedItems(selected);
    } catch (err) {
      console.error(err);
      setCart([]);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const toggleSelect = (id) =>
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const changeQuantity = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < item.min_order_qty || newQty > item.available_stock) return;

    try {
      const res = await fetch(`${BACKEND_URL}/cart/${item.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      const data = await res.json();
      if (res.ok) {
        setCart((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
        );
      } else alert(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm("Remove this item?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/cart/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setCart((prev) => prev.filter((i) => i.id !== item.id));
      else alert(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const proceedToCheckout = async () => {
    const selectedCart = cart.filter((i) => selectedItems[i.id]);
    if (!selectedCart.length) return;

    if (!window.confirm("Are you sure you want to place the order?")) return;

    const selectedIds = selectedCart.map((i) => i.id);

    try {
      const res = await fetch(`${BACKEND_URL}/cart/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_ids: selectedIds }),
      });
      const data = await res.json();

      if (res.ok) {
        setOrderDetails(data.order_details);
        setOrderId(data.order_id); // store the returned order ID
        setOrderPlaced(true);
      } else alert(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalOk = () => {
    setOrderPlaced(false);
    setOrderId(null);
    fetchCart();
    navigate("/consumer/notifications", { replace: true });
  };

  const grouped = cart.reduce((acc, item) => {
    acc[item.farmer_name] = acc[item.farmer_name] || [];
    acc[item.farmer_name].push(item);
    return acc;
  }, {});

  const selectedCart = cart.filter((i) => selectedItems[i.id]);
  const subtotal = selectedCart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const uniqueFarmers = Object.keys(grouped).filter((f) =>
    grouped[f].some((i) => selectedItems[i.id])
  );
  const shipping = uniqueFarmers.length * DELIVERY_PER_FARMER;
  const total = subtotal + shipping;

  if (!cart.length) return <p className="p-6 text-center">Your cart is empty.</p>;

  return (
    <div className="flex max-w-6xl mx-auto p-6 gap-6">
      {/* Cart Items */}
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-bold mb-4">Cart Items</h2>
        {Object.keys(grouped).map((farmer) => (
          <div key={farmer} className="bg-white p-4 rounded-xl shadow space-y-4">
            <h3 className="font-bold text-xl border-b pb-2">{farmer}</h3>
            {grouped[farmer].map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b py-3">
                <input
                  type="checkbox"
                  checked={!!selectedItems[item.id]}
                  onChange={() => toggleSelect(item.id)}
                  className="mr-2"
                />
                <img
                  src={
                    item.photo_path
                      ? `${BACKEND_URL}/uploads/${item.photo_path}`
                      : "https://via.placeholder.com/80"
                  }
                  alt={item.item_name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1 ml-4">
                  <p className="font-semibold">{item.item_name}</p>
                  <p className="text-gray-500">Rs {item.price} / kg</p>
                  <p className="text-gray-400 text-sm">Stock: {item.available_stock}</p>
                  <p className="text-gray-400 text-sm">Min Order: {item.min_order_qty}</p>
                  <p className="text-gray-700 font-medium mt-1">
                    Item Total: Rs {item.price * item.quantity}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQuantity(item, -1)} className="px-2 bg-gray-200 rounded">-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => changeQuantity(item, 1)} className="px-2 bg-gray-200 rounded">+</button>
                  </div>
                  <button onClick={() => removeItem(item)} className="text-red-600 text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="w-80 bg-gray-100 p-4 rounded-xl shadow space-y-2 sticky top-6 h-fit">
        <h3 className="font-bold text-lg">Order Summary</h3>
        <p>Subtotal ({selectedCart.length} items): Rs {subtotal}</p>
        <p>Shipping Fee: Rs {shipping}</p>
        <p className="font-bold text-xl">Total: Rs {total}</p>
        <button
          onClick={proceedToCheckout}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Proceed to Checkout ({selectedCart.length})
        </button>
      </div>

      {/* Modal for order placed */}
      {orderPlaced && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-2">Order Placed!</h2>
            {orderId && <p className="mb-2 text-gray-700">Order ID: {orderId}</p>}
            <ul className="mb-4">
              {orderDetails.map((i, idx) => (
                <li key={idx}>
                  {i.item_name} - {i.quantity} kg - Rs {i.price * i.quantity}
                </li>
              ))}
            </ul>
            <button onClick={handleModalOk} className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
