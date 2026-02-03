import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingCart, 
  MessageCircle, 
  Bell, 
  Flag, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Trash2
} from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [showComplaintBox, setShowComplaintBox] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [loadingComplaint, setLoadingComplaint] = useState(false);
  const [userComplaints, setUserComplaints] = useState([]);
  const [showComplaintsList, setShowComplaintsList] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintStats, setComplaintStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    dismissed: 0
  });

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5001/auth/me", { 
          credentials: "include" 
        });
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

  // Fetch user complaints
  const fetchUserComplaints = async () => {
    if (!user) return;
    setComplaintsLoading(true);
    try {
      const response = await fetch("http://localhost:5001/complaints/my-complaints", {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUserComplaints(data.complaints);
      } else {
        console.error("Failed to fetch complaints:", data.error);
        setUserComplaints([]);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setUserComplaints([]);
    } finally {
      setComplaintsLoading(false);
    }
  };

  // Fetch complaint statistics
  const fetchComplaintStats = async () => {
    if (!user) return;
    try {
      const response = await fetch("http://localhost:5001/complaints/stats", {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setComplaintStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching complaint stats:", error);
    }
  };

  // Fetch cart
  const fetchCart = async () => {
    if (!user) return;
    try {
      const res = await fetch("http://localhost:5001/cart/", { 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCart(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCart([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
      fetchUserComplaints();
      fetchComplaintStats();
    }
  }, [user]);

  // Submit complaint to admin
  const submitComplaint = async () => {
    if (!complaintText.trim()) {
      alert("Please describe your issue");
      return;
    }

    setLoadingComplaint(true);
    try {
      const response = await fetch("http://localhost:5001/complaints/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint_text: complaintText }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ Complaint sent to admin!");
        setComplaintText("");
        setShowComplaintBox(false);
        fetchUserComplaints(); // Refresh complaints list
        fetchComplaintStats(); // Refresh stats
      } else {
        alert(data.error || "Failed to submit complaint");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting complaint");
    } finally {
      setLoadingComplaint(false);
    }
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'dismissed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Complaint Modal Component
  const ComplaintModal = () => {
  // Add ref and useEffect
  const textareaRef = React.useRef(null);
  
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Report Issue to Admin</h3>
        
        <textarea
          ref={textareaRef}
          value={complaintText}
          onChange={(e) => setComplaintText(e.target.value)}
          placeholder="Describe your issue or complaint..."
          className="w-full h-40 p-3 border rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          maxLength={500}
        />
        
        <div className="flex justify-between text-sm text-gray-500 mb-6">
          <div>Admin will review your complaint</div>
          <div>{complaintText.length}/500</div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowComplaintBox(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loadingComplaint}
          >
            Cancel
          </button>
          <button
            onClick={submitComplaint}
            disabled={loadingComplaint || !complaintText.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            {loadingComplaint ? "Sending..." : "Send to Admin"}
          </button>
        </div>
      </div>
    </div>
  );
};
  // Complaints List Modal
  const ComplaintsListModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold">My Complaints</h3>
            <p className="text-sm text-gray-600 mt-1">
              Total: {userComplaints.length} complaints • 
              Pending: {complaintStats.pending} • 
              Resolved: {complaintStats.resolved}
            </p>
          </div>
          <button
            onClick={() => setShowComplaintsList(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {complaintsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading complaints...</p>
          </div>
        ) : userComplaints.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No complaints yet</h4>
            <p className="text-gray-600">You haven't submitted any complaints.</p>
            <button
              onClick={() => {
                setShowComplaintsList(false);
                setShowComplaintBox(true);
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Submit Your First Complaint
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-yellow-700">{complaintStats.pending}</div>
                    <div className="text-sm text-yellow-600">Pending</div>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-700">{complaintStats.resolved}</div>
                    <div className="text-sm text-green-600">Resolved</div>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-700">{complaintStats.dismissed}</div>
                    <div className="text-sm text-red-600">Dismissed</div>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Complaints List */}
            <div className="space-y-3">
              {userComplaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(complaint.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: #{complaint.id}
                        </span>
                        <span className="text-xs text-gray-500">
                          • {complaint.created_at}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{complaint.complaint_text}</p>
                      
                      {/* Admin Reply Section */}
                      {complaint.admin_reply && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">Admin Response:</span>
                          </div>
                          <p className="text-sm text-gray-800">{complaint.admin_reply}</p>
                          {complaint.updated_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Updated: {complaint.updated_at}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-9 flex flex-col">
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
          <button className="w-full text-left block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-md transition">
            Products
          </button>

          <Link
            to="/consumer/cart"
            className="block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-md transition"
          >
            Cart ({cart.length})
          </Link>
          
          {/* My Complaints Link */}
          <button
            onClick={() => setShowComplaintsList(true)}
            className="w-full text-left block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-md transition flex items-center justify-between"
          >
            <span>My Complaints</span>
            {complaintStats.total > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {complaintStats.total}
              </span>
            )}
          </button>

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

        {/* Complaint Modal */}
        {showComplaintBox && <ComplaintModal />}

        {/* Complaints List Modal */}
        {showComplaintsList && <ComplaintsListModal />}

        {/* Report Issue Button - BOTTOM RIGHT */}
        <button
          onClick={() => setShowComplaintBox(true)}
          className="fixed bottom-6 right-6 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 z-40 flex items-center gap-2"
          title="Report an issue to admin"
        >
          <Flag size={20} />
          <span className="hidden sm:inline">Report Issue</span>
        </button>

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
            {/* View Complaints Button */}
            <button
              onClick={() => setShowComplaintsList(true)}
              className="relative text-gray-700 hover:text-red-600"
              title="View my complaints"
            >
              <Flag className="w-6 h-6" />
              {complaintStats.pending > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {complaintStats.pending}
                </span>
              )}
            </button>

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

// Product Card Component
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
        
        <Link
          to={`/consumer/messages/${product.farmer_id}`}
          className="text-green-600 text-sm font-semibold hover:underline mt-2 block flex items-center gap-1"
        >
          <MessageCircle className="w-3 h-3" />
          Chat with Farmer
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;