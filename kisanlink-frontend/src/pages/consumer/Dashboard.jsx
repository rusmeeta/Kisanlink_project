import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, MessageCircle, Bell } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5001/auth/me", { credentials: "include" });
        if (!res.ok) throw new Error("User not authenticated");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        window.location.href = "/login";
      }
    };
    fetchUser();
  }, []);

  // Fetch cart
  const fetchCart = async () => {
    if (!user) return;
    try {
      const res = await fetch("http://localhost:5001/cart/", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCart(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCart([]);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  // Add to cart
  const addToCart = async (product, quantity = 1) => {
    try {
      const res = await fetch("http://localhost:5001/cart/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id, quantity }),
      });
      const data = await res.json();

      if (res.ok) {
        setToast(`"${product.item_name}" added to cart`);
        fetchCart();
        setTimeout(() => setToast(""), 2000);
      } else {
        alert(data.message || "Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding to cart");
    }
  };

  // Fetch products
  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5001/products/farmer-items", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();

        const withDistance = data.map((item) => {
          const uLat = parseFloat(user.latitude);
          const uLon = parseFloat(user.longitude);
          const fLat = parseFloat(item.latitude || item.farmer_lat);
          const fLon = parseFloat(item.longitude || item.farmer_lon);

          let distance = "N/A";
          if (!isNaN(uLat) && !isNaN(uLon) && !isNaN(fLat) && !isNaN(fLon)) {
            const dist = getDistanceFromLatLonInKm(uLat, uLon, fLat, fLon);
            distance = dist < 0.05 ? "Nearby" : dist.toFixed(2) + " km";
          }

          return { ...item, distance };
        });

        withDistance.sort((a, b) => {
          if (a.distance === "Nearby") return -1;
          if (b.distance === "Nearby") return 1;
          return (parseFloat(a.distance) || Infinity) - (parseFloat(b.distance) || Infinity);
        });

        setProducts(withDistance);
      } catch (err) {
        console.error(err);
        setProducts([]);
      }
    };

    fetchProducts();
  }, [user]);

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const deg2rad = (deg) => deg * (Math.PI / 180);
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.item_name?.toLowerCase().includes(q) ||
      p.farmer_name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.distance?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col">
        <div className="mb-8 text-center">
          <div className="h-20 w-20 mx-auto rounded-full bg-green-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
            {user ? user.fullname[0] : "C"}
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-800">{user?.fullname || "Consumer"}</h2>
          <p className="text-gray-500">{user?.email}</p>
          <p className="text-gray-400 text-sm mt-1">Location: {user?.location}</p>
          <p className="text-gray-500 text-sm mt-2">Cart Items: {cart.length}</p>
        </div>

        <nav className="flex-1 space-y-2">
          <Link className="block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-md transition">
            Products
          </Link>

          <Link
            to="/consumer/cart"
            className="block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-md transition"
          >
            Cart ({cart.length})
          </Link>
          <Link
            to="/consumer/order-status"
            className="block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-md transition"
          >
            Order Status
          </Link>

          <Link
            to="/consumer/notifications"
            className="block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-md transition"
          >
            Notifications
          </Link>

          <Link
            to="/consumer/messages"
            className="block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-md transition"
          >
            Messages
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col relative">
        {toast && (
          <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-slide-in">
            {toast}
          </div>
        )}

        <header className="bg-white shadow-md p-4 flex items-center justify-between">
          {/* Left side: logo + notifications */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-green-600">KisanLink</div>
            <Link to="/consumer/notifications" className="relative">
              <Bell className="w-6 h-6 text-gray-700 cursor-pointer" />
            </Link>
          </div>

          {/* Search */}
          <div className="flex-1 mx-6">
            <input
              type="text"
              placeholder="Search products, farmers, places..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Right side: cart, messages, logout */}
          <div className="flex items-center space-x-4">
            <Link to="/consumer/cart" className="relative">
              <ShoppingCart className="w-6 h-6 text-gray-700 cursor-pointer" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>

            <Link to="/consumer/messages">
              <MessageCircle className="w-6 h-6 text-gray-700 cursor-pointer" />
            </Link>



            <button
              onClick={async () => {
                await fetch("http://localhost:5001/auth/logout", {
                  method: "POST",
                  credentials: "include",
                });
                window.location.href = "/login";
              }}
              className="text-red-600 font-semibold hover:underline"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Products Near You</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.filter((p) => p.available_stock > 5).length === 0 ? (
              <p className="text-gray-500 col-span-full">No products found.</p>
            ) : (
              filteredProducts
                .filter((p) => p.available_stock > 5)
                .map((product) => (
                  <ProductCard key={product.id} product={product} addToCart={addToCart} />
                ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// Product Card
const ProductCard = ({ product, addToCart }) => {
  const [quantity, setQuantity] = React.useState(product.min_order_qty || 1);

  const handleQuantityChange = (e) => {
    let val = Number(e.target.value);
    if (val < (product.min_order_qty || 1)) val = product.min_order_qty || 1;
    if (val > product.available_stock) val = product.available_stock;
    setQuantity(val);
  };

  const handleAddToCart = () => {
    if (quantity > product.available_stock) {
      alert(`Cannot order more than available stock (${product.available_stock})`);
      return;
    }
    addToCart(product, quantity);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transform transition duration-300 overflow-hidden relative group">
      <div className="relative h-40">
        <img
          src={
            product.photo_path
              ? `http://localhost:5001/uploads/${product.photo_path}`
              : "https://via.placeholder.com/150"
          }
          alt={product.item_name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <h3 className="text-lg font-bold text-gray-800 truncate">{product.item_name}</h3>
        <p className="text-sm text-gray-600 truncate">
          Farmer: <span className="font-semibold">{product.farmer_name}</span>
        </p>
        <p className="text-xs text-gray-500 truncate">
          Location: <span className="font-semibold">{product.location || "N/A"}</span>
        </p>
        <p className="text-xs text-gray-500 mb-2">
          Distance: <span className="font-semibold">{product.distance}</span>
        </p>

        <div className="flex items-center justify-between mb-2">
          <p className="text-green-600 font-bold text-sm">Rs {product.price} / kg</p>
          <p className="text-xs text-gray-500">Stock: {product.available_stock}</p>
        </div>

        <div className="flex items-center justify-between">
          <input
            type="number"
            min={product.min_order_qty || 1}
            max={product.available_stock}
            value={quantity}
            onChange={handleQuantityChange}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button
            onClick={handleAddToCart}
            className="bg-green-600 text-white text-sm font-semibold py-1 px-3 rounded hover:bg-green-700 transition"
          >
            Add
          </button>
        </div>
        {/* Add this link for messaging the farmer */}
        <Link
          to={`/consumer/messages/${product.farmer_id}`}
          className="text-green-600 text-sm font-semibold hover:underline mt-2 block"
        >
          Chat with Farmer
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
