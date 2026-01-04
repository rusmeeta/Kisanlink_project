// src/pages/farmer/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import {
  Bell, MessageCircle, Edit3, Mail, MapPin,
  Package, ShoppingCart, Clock, Truck, CheckCircle
} from "lucide-react";

const FarmerDashboard = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]); // NEW: For orders
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingNotifications: 0,
    pendingOrders: 0 // NEW
  });
  const [unreadCounts, setUnreadCounts] = useState({
    notifications: 0,
    messages: 0
  });

  const navigate = useNavigate();
  const location = useLocation();
  
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/farmer/add-product')) return 'addProduct';
    if (path.includes('/farmer/products')) return 'productList';
    if (path.includes('/farmer/report')) return 'reports';
    if (path.includes('/farmer/notifications')) return 'notifications';
    if (path.includes('/farmer/orders')) return 'orders';
    return 'dashboard';
  };

  const activeTab = getActiveTab();
  const POLL_INTERVAL = 10000;

  // Fetch farmer data
  const fetchFarmerData = async () => {
    try {
      const res = await fetch("http://localhost:5001/farmer/me", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Error fetching farmer info:", err);
    }
  };

  // NEW: Fetch recent orders
  // In fetchRecentOrders function
const fetchRecentOrders = async () => {
  try {
    const farmerId = localStorage.getItem("userId");
    if (!farmerId) {
      console.error("No farmer ID found");
      return;
    }

    const response = await fetch(`http://localhost:5001/orders/farmer/${farmerId}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch orders: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    if (data.orders) {
      // Sort by newest first
      const sortedOrders = data.orders.sort((a, b) => 
        new Date(b.order_date) - new Date(a.order_date)
      );
      
      setRecentOrders(sortedOrders);
      
      // Count pending orders
      const pending = sortedOrders.filter(o => 
        o.status === 'placed' || o.status === 'preparing'
      ).length;
      
      setStats(prev => ({
        ...prev,
        pendingOrders: pending
      }));
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    // Set empty array on error
    setRecentOrders([]);
  }
};
  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const farmerId = localStorage.getItem("userId");
      
      const response = await fetch("http://localhost:5001/orders/update-status", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          order_id: orderId,
          farmer_id: farmerId,
          new_status: newStatus
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh orders after update
          fetchRecentOrders();
          alert(`✅ Order status updated to ${newStatus}`);
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5001/notifications", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setNotifications(notifs);

        const unread = notifs.filter(n => !n.is_read).length;
        setUnreadCounts(prev => ({ ...prev, notifications: unread }));
        setStats(prev => ({ ...prev, pendingNotifications: unread }));
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await fetch("http://localhost:5001/messages/farmer-conversations", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          const conversations = data.conversations || [];
          setMessages(conversations);
          
          const unreadCount = conversations.reduce((count, conv) => {
            return count + (conv.unread_count || 0);
          }, 0);
          
          setUnreadCounts(prev => ({ ...prev, messages: unreadCount }));
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Fetch farmer statistics
  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch products count
      const productsRes = await fetch("http://localhost:5001/farmer/products", {
        credentials: "include",
      });
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const productCount = productsData.products?.length || 0;
        
        setStats(prev => ({
          ...prev,
          totalProducts: productCount
        }));
      }

      // Fetch total orders count
      try {
        const ordersRes = await fetch(`http://localhost:5001/api/farmer/report/${user.id}`, {
          credentials: "include",
        });
        
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const orderCount = ordersData.summary?.totalOrders || 0;
          
          setStats(prev => ({
            ...prev,
            totalOrders: orderCount
          }));
        }
      } catch (orderErr) {
        console.error("Error fetching orders:", orderErr);
        setStats(prev => ({
          ...prev,
          totalOrders: 0
        }));
      }

    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const res = await fetch("http://localhost:5001/notifications", {
        method: "GET",
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        
        const recentActivitiesData = notifs
          .slice(0, 3)
          .map((notif, idx) => ({
            id: notif.id || idx + 1,
            type: getActivityType(notif),
            message: notif.message,
            time: formatTimeAgo(notif.created_at),
            status: getStatusFromMessage(notif.message),
            priority: notif.is_read ? "low" : "high"
          }));
        
        setRecentActivities(recentActivitiesData);
      }
    } catch (err) {
      console.error("Error fetching recent activities:", err);
      setRecentActivities([]);
    }
  };

  // Helper functions
  const getActivityType = (notification) => {
    if (notification.order_id) return "order";
    if (notification.farmer_id) return "message";
    if (notification.message?.toLowerCase().includes('product')) return "product";
    return "system";
  };

  const getStatusFromMessage = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('delivered') || msg.includes('completed')) return 'delivered';
    if (msg.includes('confirmed') || msg.includes('processing')) return 'processing';
    if (msg.includes('cancelled') || msg.includes('failed')) return 'cancelled';
    if (msg.includes('ordered') || msg.includes('placed')) return 'pending';
    return 'info';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Initial fetch
  useEffect(() => {
    fetchFarmerData();
    fetchNotifications();
    fetchMessages();
    fetchStats();
    fetchRecentActivities();
    fetchRecentOrders(); // NEW: Fetch orders
  }, []);

  // Update when user data is loaded
  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentOrders();
    }
  }, [user]);

  // Real-time polling
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "dashboard") {
        fetchNotifications();
        fetchMessages();
        fetchStats();
        fetchRecentActivities();
        fetchRecentOrders(); // NEW: Poll orders too
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5001/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    } catch (err) {
      window.location.href = "/login";
    }
  };

  // Sidebar navigation items - WITH ORDERS
  const navItems = [
    { id: "dashboard", label: "Dashboard", path: "/farmer/dashboard" },
    { id: "addProduct", label: "Add Product", path: "/farmer/add-product" },
    { id: "productList", label: "Product List", path: "/farmer/products" },
    { id: "orders", label: "Orders", path: "/farmer/orders" }, // NEW
    { id: "reports", label: "Reports", path: "/farmer/report" },
    { id: "notifications", label: `Notifications (${unreadCounts.notifications})`, path: "/farmer/notifications" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-center border-b">
          <div className="h-20 w-20 mx-auto rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold">
            {user ? user.fullname[0] : "F"}
          </div>
          <h2 className="mt-3 font-bold text-lg text-gray-800">{user?.fullname || "Farmer"}</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.location || ""}</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === item.id
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-green-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Messages */}
          <Link
            to="/farmer/messages"
            className="block w-full text-left px-4 py-2 rounded-lg font-semibold transition text-gray-700 hover:bg-green-100 relative"
          >
            Messages
            {unreadCounts.messages > 0 && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {unreadCounts.messages > 99 ? '99+' : unreadCounts.messages}
              </span>
            )}
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">
            Welcome, {user?.fullname}!
          </h1>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Link
              to="/farmer/notifications"
              className="relative bg-white p-2 rounded-full hover:bg-gray-100 transition shadow-sm"
              title={`${unreadCounts.notifications} unread notifications`}
            >
              <Bell className="w-6 h-6 text-green-600" />
              {unreadCounts.notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCounts.notifications > 99 ? '99+' : unreadCounts.notifications}
                </span>
              )}
            </Link>

            {/* Messages */}
            <Link
              to="/farmer/messages"
              className="relative bg-white p-2 rounded-full hover:bg-gray-100 transition shadow-sm"
              title={`${unreadCounts.messages} unread messages`}
            >
              <MessageCircle className="w-6 h-6 text-green-600" />
              {unreadCounts.messages > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCounts.messages > 99 ? '99+' : unreadCounts.messages}
                </span>
              )}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Render Dashboard content */}
        {activeTab === "dashboard" && user ? (
          <div className="space-y-8">
            {/* Farmer Info Card */}
            <div className="bg-white p-6 rounded-2xl shadow mb-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.fullname[0]}
                </div>
                <div className="flex flex-col space-y-1">
                  <h2 className="text-xl font-bold text-gray-800">{user.fullname}</h2>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-1 text-green-600" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-1 text-green-600" />
                    <span>{user.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <Link
                  to="/farmer/add-product"
                  className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <Package size={16} />
                  <span>Add Product</span>
                </Link>
                <Link
                  to="/farmer/orders"
                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <ShoppingCart size={16} />
                  <span>View Orders</span>
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3">
                  <Package className="w-8 h-8 text-green-600" />
                  <span className="text-sm text-gray-500">Products</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalProducts}</h3>
                <p className="text-sm text-gray-600 mt-1">Total products</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                  <span className="text-sm text-gray-500">Total Orders</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalOrders}</h3>
                <p className="text-sm text-gray-600 mt-1">All orders</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <span className="text-sm text-gray-500">New Orders</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pendingOrders}</h3>
                <p className="text-sm text-gray-600 mt-1">Awaiting action</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3">
                  <Bell className="w-8 h-8 text-purple-600" />
                  <span className="text-sm text-gray-500">Alerts</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pendingNotifications}</h3>
                <p className="text-sm text-gray-600 mt-1">Unread notifications</p>
              </div>
            </div>

            {/* Recent Orders Section */}
            {recentOrders.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                  <Link 
                    to="/farmer/orders"
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    View All →
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          order.status === 'placed' ? 'bg-blue-100' :
                          order.status === 'preparing' ? 'bg-yellow-100' :
                          'bg-green-100'
                        }`}>
                          <span className="text-lg">
                            {order.status === 'placed' ? '🛒' :
                             order.status === 'preparing' ? '👨‍🌾' : '✅'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            Order #{order.id} • ₹{order.total_price}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {order.consumer_name || `Customer ${order.consumer_id}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(order.order_date)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'placed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                        
                        {/* Simple Status Update Buttons */}
                        {order.status === 'placed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Start Preparing
                          </button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Mark Ready
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
                <span className="text-sm text-green-600 font-medium">Showing 3 latest</span>
              </div>

              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <p className="text-gray-500">No recent activities</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'order' ? 'bg-blue-100' :
                          activity.type === 'message' ? 'bg-green-100' :
                          activity.type === 'product' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <span className={`text-sm ${
                            activity.type === 'order' ? 'text-blue-600' :
                            activity.type === 'message' ? 'text-green-600' :
                            activity.type === 'product' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {activity.type === 'order' ? '📦' :
                             activity.type === 'message' ? '💬' :
                             activity.type === 'product' ? '📝' : '🔔'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{activity.message}</h4>
                          <div className="flex items-center mt-1">
                            <span className="text-xs px-2 py-1 rounded-full capitalize bg-gray-200 text-gray-700">
                              {activity.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/farmer/add-product"
                  className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition flex flex-col items-center justify-center text-center"
                >
                  <Package className="w-6 h-6 mb-2" />
                  <span className="font-medium">Add Product</span>
                </Link>
                <Link
                  to="/farmer/orders"
                  className="bg-white text-green-600 border border-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition flex flex-col items-center justify-center text-center"
                >
                  <ShoppingCart className="w-6 h-6 mb-2" />
                  <span className="font-medium">Manage Orders</span>
                </Link>
                <Link
                  to="/farmer/messages"
                  className="bg-white text-green-600 border border-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition flex flex-col items-center justify-center text-center"
                >
                  <MessageCircle className="w-6 h-6 mb-2" />
                  <span className="font-medium">Messages</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Render nested routes
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default FarmerDashboard;