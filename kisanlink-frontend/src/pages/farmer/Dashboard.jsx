// src/pages/farmer/Dashboard.jsx - FINAL NO-ERROR VERSION
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import {
  Bell, MessageCircle, Mail, MapPin,
  Package, ShoppingCart, Clock, Flag
} from "lucide-react";
import { API_BASE } from '../../api';

const FarmerDashboard = () => {
  const [user, setUser] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, pendingOrders: 0 });
  const [unreadCounts, setUnreadCounts] = useState({ notifications: 0, messages: 0 });
  const [showComplaintBox, setShowComplaintBox] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [loadingComplaint, setLoadingComplaint] = useState(false);
  const [userComplaints, setUserComplaints] = useState([]);
  const [showComplaintsList, setShowComplaintsList] = useState(false);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintStats, setComplaintStats] = useState({ total: 0, pending: 0, resolved: 0, dismissed: 0 });

  const navigate = useNavigate();
  const location = useLocation();

  const getToken = () => localStorage.getItem('access_token');
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/add-product')) return 'addProduct';
    if (path.includes('/products')) return 'productList';
    if (path.includes('/report')) return 'reports';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/orders')) return 'orders';
    return 'dashboard';
  };
  const activeTab = getActiveTab();

  // Fetch user
  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    } catch (err) { console.error(err); }
  };

  // Fetch stats
  const fetchStats = async () => {
    if (!user) return;
    try {
      const productsRes = await fetch(`${API_BASE}/farmer/products`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (productsRes.ok) {
        const data = await productsRes.json();
        setStats(prev => ({ ...prev, totalProducts: data.products?.length || 0 }));
      }
    } catch (err) { console.error(err); }
  };

  // Fetch orders
  const fetchOrders = async () => {
    const farmerId = localStorage.getItem("userId");
    if (!farmerId) return;
    try {
      const res = await fetch(`${API_BASE}/orders/farmer/${farmerId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setRecentOrders(data.orders.slice(0, 3));
          const pending = data.orders.filter(o => o.status === 'placed' || o.status === 'preparing').length;
          setStats(prev => ({ ...prev, pendingOrders: pending, totalOrders: data.orders.length }));
        }
      }
    } catch (err) { console.error(err); }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUnreadCounts(prev => ({ ...prev, notifications: data.count || 0 }));
      }
    } catch (err) { console.error(err); }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/farmer-conversations`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          const total = (data.conversations || []).reduce((sum, c) => sum + (c.unread_count || 0), 0);
          setUnreadCounts(prev => ({ ...prev, messages: total }));
        }
      }
    } catch (err) { console.error(err); }
  };

  // Fetch activities
  const fetchActivities = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        const activities = notifs.slice(0, 3).map((n, i) => ({
          id: n.id || i,
          type: n.order_id ? 'order' : 'system',
          message: n.message,
          time: new Date(n.created_at).toLocaleDateString()
        }));
        setRecentActivities(activities);
      }
    } catch (err) { console.error(err); }
  };

  // Fetch complaints
  const fetchComplaints = async () => {
    if (!user) return;
    setComplaintsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/complaints/my-complaints`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUserComplaints(data.complaints);
          const stats = {
            total: data.complaints.length,
            pending: data.complaints.filter(c => c.status === 'pending').length,
            resolved: data.complaints.filter(c => c.status === 'resolved').length,
            dismissed: data.complaints.filter(c => c.status === 'dismissed').length
          };
          setComplaintStats(stats);
        }
      }
    } catch (err) { console.error(err); }
    setComplaintsLoading(false);
  };

  // Submit complaint
  const submitComplaint = async () => {
    if (!complaintText.trim()) { alert("Please describe your issue"); return; }
    setLoadingComplaint(true);
    try {
      const res = await fetch(`${API_BASE}/complaints/submit`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ complaint_text: complaintText })
      });
      if (res.ok) {
        alert("✅ Complaint sent!");
        setComplaintText("");
        setShowComplaintBox(false);
        fetchComplaints();
      } else {
        alert("Failed to submit");
      }
    } catch (err) { alert("Error submitting"); }
    setLoadingComplaint(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchOrders();
      fetchNotifications();
      fetchMessages();
      fetchActivities();
      fetchComplaints();
    }
  }, [user]);

  // Complaint Modal
  const ComplaintModal = () => {
    if (!showComplaintBox) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Report Issue</h3>
          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Describe your issue..."
            className="w-full h-40 p-3 border rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowComplaintBox(false)} className="px-4 py-2 text-gray-600">Cancel</button>
            <button onClick={submitComplaint} disabled={loadingComplaint} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              {loadingComplaint ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Complaints List Modal
  const ComplaintsListModal = () => {
    if (!showComplaintsList) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">My Complaints</h3>
            <button onClick={() => setShowComplaintsList(false)} className="text-gray-500">✕</button>
          </div>
          {complaintsLoading ? <p>Loading...</p> : userComplaints.length === 0 ? <p>No complaints.</p> : (
            <div className="space-y-4">
              {userComplaints.map((c) => (
                <div key={c.id} className="border p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'pending' ? 'bg-yellow-100' : c.status === 'resolved' ? 'bg-green-100' : 'bg-red-100'}`}>{c.status}</span>
                    <span className="text-xs text-gray-500">#{c.id}</span>
                  </div>
                  <p className="text-gray-700">{c.complaint_text}</p>
                  {c.admin_reply && <p className="mt-2 p-2 bg-blue-50 text-sm rounded">Admin: {c.admin_reply}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <ComplaintModal />
      <ComplaintsListModal />

      <button onClick={() => setShowComplaintBox(true)} className="fixed bottom-6 right-6 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 z-40">
        <Flag size={20} />
      </button>

      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-center border-b">
          <div className="h-20 w-20 mx-auto rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold">
            {user ? user.fullname[0] : "F"}
          </div>
          <h2 className="mt-3 font-bold text-lg text-gray-800">{user?.fullname || "Farmer"}</h2>
          <p className="text-sm text-gray-500">{user?.location || ""}</p>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <Link to="/farmer/dashboard" className={`block px-4 py-2 rounded-lg font-semibold ${activeTab === 'dashboard' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-green-100'}`}>Dashboard</Link>
          <Link to="/farmer/add-product" className={`block px-4 py-2 rounded-lg font-semibold ${activeTab === 'addProduct' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-green-100'}`}>Add Product</Link>
          <Link to="/farmer/products" className={`block px-4 py-2 rounded-lg font-semibold ${activeTab === 'productList' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-green-100'}`}>Product List</Link>
          <Link to="/farmer/orders" className={`block px-4 py-2 rounded-lg font-semibold ${activeTab === 'orders' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-green-100'}`}>Orders</Link>
          <Link to="/farmer/report" className={`block px-4 py-2 rounded-lg font-semibold ${activeTab === 'reports' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-green-100'}`}>Reports</Link>
          <Link to="/farmer/notifications" className={`block px-4 py-2 rounded-lg font-semibold ${activeTab === 'notifications' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-green-100'}`}>Notifications ({unreadCounts.notifications})</Link>
          <button onClick={() => setShowComplaintsList(true)} className="w-full text-left px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-green-100 flex justify-between">
            <span>My Complaints</span>
            {complaintStats.total > 0 && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{complaintStats.total}</span>}
          </button>
          <Link to="/farmer/messages" className="block px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-green-100 relative">
            Messages
            {unreadCounts.messages > 0 && <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{unreadCounts.messages}</span>}
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">Welcome, {user?.fullname || "Farmer"}!</h1>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg">Logout</button>
        </div>

        {activeTab === "dashboard" && user ? (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">{user.fullname[0]}</div>
                <div>
                  <h2 className="text-xl font-bold">{user.fullname}</h2>
                  <div className="flex items-center text-gray-600"><Mail className="w-4 h-4 mr-1" />{user.email}</div>
                  <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-1" />{user.location}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow"><Package className="w-8 h-8 text-green-600" /><h3 className="text-2xl font-bold">{stats.totalProducts}</h3><p>Products</p></div>
              <div className="bg-white p-6 rounded-2xl shadow"><ShoppingCart className="w-8 h-8 text-blue-600" /><h3 className="text-2xl font-bold">{stats.totalOrders}</h3><p>Orders</p></div>
              <div className="bg-white p-6 rounded-2xl shadow"><Clock className="w-8 h-8 text-yellow-600" /><h3 className="text-2xl font-bold">{stats.pendingOrders}</h3><p>Pending</p></div>
              <div className="bg-white p-6 rounded-2xl shadow"><Bell className="w-8 h-8 text-purple-600" /><h3 className="text-2xl font-bold">{unreadCounts.notifications}</h3><p>Notifications</p></div>
            </div>

            {recentOrders.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-2">
                    <div><span className="font-semibold">#{order.id}</span> - ₹{order.total_price}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'placed' ? 'bg-blue-100' : order.status === 'preparing' ? 'bg-yellow-100' : 'bg-green-100'}`}>{order.status}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
              {recentActivities.length === 0 ? <p className="text-gray-500">No activities</p> : recentActivities.map((a) => (
                <div key={a.id} className="border-b py-2 flex justify-between"><span>{a.message}</span><span className="text-sm text-gray-500">{a.time}</span></div>
              ))}
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default FarmerDashboard;