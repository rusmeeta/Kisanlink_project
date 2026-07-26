// src/pages/farmer/Dashboard.jsx - UPDATED WITH API_BASE
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import {
  Bell, MessageCircle, Edit3, Mail, MapPin,
  Package, ShoppingCart, Clock, Truck, CheckCircle,
  Flag, Eye, RefreshCw
} from "lucide-react";
import { API_BASE } from '../api';

const FarmerDashboard = () => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingNotifications: 0,
    pendingOrders: 0
  });
  
  const [unreadCounts, setUnreadCounts] = useState({
    notifications: 0,
    messages: 0
  });
  
  const [refreshingNotifications, setRefreshingNotifications] = useState(false);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  
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

  // Get token from localStorage
  const getToken = () => localStorage.getItem('access_token');

  // Fetch farmer data
  const fetchFarmerData = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        console.error("Failed to fetch user data:", res.status);
        // If 401, redirect to login
        if (res.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      }
    } catch (err) {
      console.error("Error fetching farmer info:", err);
    }
  };

  // Fetch unread notifications count
  const fetchUnreadNotifications = useCallback(async () => {
    try {
      setRefreshingNotifications(true);
      const response = await fetch(`${API_BASE}/notifications/unread-count`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCounts(prev => ({ ...prev, notifications: data.count || 0 }));
          setStats(prev => ({ ...prev, pendingNotifications: data.count || 0 }));
        }
      }
    } catch (err) {
      console.error("Error fetching notifications count:", err);
    } finally {
      setRefreshingNotifications(false);
    }
  }, []);

  // Fetch unread messages count
  const fetchUnreadMessages = useCallback(async () => {
    try {
      setRefreshingMessages(true);
      const response = await fetch(`${API_BASE}/messages/farmer-conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          const totalUnreadMessages = (data.conversations || []).reduce(
            (total, conv) => total + (conv.unread_count || 0), 0
          );
          setUnreadCounts(prev => ({ ...prev, messages: totalUnreadMessages }));
        }
      }
    } catch (err) {
      console.error("Error fetching messages count:", err);
    } finally {
      setRefreshingMessages(false);
    }
  }, []);

  const refreshDashboardData = useCallback(() => {
    if (user) {
      fetchUnreadNotifications();
      fetchUnreadMessages();
      fetchRecentOrders();
      fetchStats();
    }
  }, [user, fetchUnreadNotifications, fetchUnreadMessages]);

  useEffect(() => {
    if (!user) return;
    refreshDashboardData();
    const interval = setInterval(refreshDashboardData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, refreshDashboardData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !refreshingNotifications && !refreshingMessages) {
        refreshDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, refreshingNotifications, refreshingMessages, refreshDashboardData]);

  useEffect(() => {
    const handleNotificationsMarkedRead = () => fetchUnreadNotifications();
    window.addEventListener('notifications-marked-read', handleNotificationsMarkedRead);
    return () => window.removeEventListener('notifications-marked-read', handleNotificationsMarkedRead);
  }, [fetchUnreadNotifications]);

  useEffect(() => {
    const handleMessagesMarkedRead = () => fetchUnreadMessages();
    window.addEventListener('messages-marked-read', handleMessagesMarkedRead);
    return () => window.removeEventListener('messages-marked-read', handleMessagesMarkedRead);
  }, [fetchUnreadMessages]);

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    try {
      const farmerId = localStorage.getItem("userId");
      if (!farmerId) {
        console.error("No farmer ID found");
        return;
      }

      const response = await fetch(`${API_BASE}/orders/farmer/${farmerId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch orders: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      if (data.orders) {
        const sortedOrders = data.orders.sort((a, b) => 
          new Date(b.order_date) - new Date(a.order_date)
        );
        setRecentOrders(sortedOrders);
        const pending = sortedOrders.filter(o => 
          o.status === 'placed' || o.status === 'preparing'
        ).length;
        setStats(prev => ({ ...prev, pendingOrders: pending }));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setRecentOrders([]);
    }
  };

  // Fetch farmer complaints
  const fetchUserComplaints = async () => {
    if (!user) return;
    setComplaintsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/complaints/my-complaints`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUserComplaints(data.complaints);
        const stats = {
          total: data.complaints.length,
          pending: data.complaints.filter(c => c.status === 'pending').length,
          resolved: data.complaints.filter(c => c.status === 'resolved').length,
          dismissed: data.complaints.filter(c => c.status === 'dismissed').length
        };
        setComplaintStats(stats);
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

  // Submit complaint to admin
  const submitComplaint = async () => {
    if (!complaintText.trim()) {
      alert("Please describe your issue");
      return;
    }

    setLoadingComplaint(true);
    try {
      const response = await fetch(`${API_BASE}/complaints/submit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ complaint_text: complaintText }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("✅ Complaint sent to admin!");
        setComplaintText("");
        setShowComplaintBox(false);
        fetchUserComplaints();
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

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const farmerId = localStorage.getItem("userId");
      
      const response = await fetch(`${API_BASE}/orders/update-status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          order_id: orderId,
          farmer_id: farmerId,
          new_status: newStatus
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchRecentOrders();
          alert(`✅ Order status updated to ${newStatus}`);
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  // Fetch farmer statistics
  const fetchStats = async () => {
    if (!user) return;

    try {
      const productsRes = await fetch(`${API_BASE}/farmer/products`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const productCount = productsData.products?.length || 0;
        setStats(prev => ({ ...prev, totalProducts: productCount }));
      }

      try {
        const ordersRes = await fetch(`${API_BASE}/api/farmer/report/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const orderCount = ordersData.summary?.totalOrders || 0;
          setStats(prev => ({ ...prev, totalOrders: orderCount }));
        }
      } catch (orderErr) {
        console.error("Error fetching orders:", orderErr);
        setStats(prev => ({ ...prev, totalOrders: 0 }));
      }

    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        const recentActivitiesData = notifs.slice(0, 3).map((notif, idx) => ({
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
    const diffMins = Math.floor((now - date) / 60000);
    const diffHours = Math.floor((now - date) / 3600000);
    const diffDays = Math.floor((now - date) / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFarmerData();
    fetchStats();
    fetchRecentActivities();
    fetchRecentOrders();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentOrders();
      fetchUserComplaints();
      fetchUnreadNotifications();
      fetchUnreadMessages();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      localStorage.removeItem('access_token');
      window.location.href = "/login";
    } catch (err) {
      window.location.href = "/login";
    }
  };

  // Complaint Modal Component (keep the same)
  const ComplaintModal = () => {
    const textareaRef = React.useRef(null);
    
    React.useEffect(() => {
      if (textareaRef.current && showComplaintBox) {
        textareaRef.current.focus();
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, [showComplaintBox]);

    const handleTextChange = React.useCallback((e) => {
      setComplaintText(e.target.value);
    }, []);

    const handleSubmit = React.useCallback(() => {
      submitComplaint();
    }, []);

    const handleClose = React.useCallback(() => {
      setShowComplaintBox(false);
    }, []);

    if (!showComplaintBox) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Report Issue to Admin</h3>
          
          <textarea
            ref={textareaRef}
            value={complaintText}
            onChange={handleTextChange}
            placeholder="Describe your issue or complaint..."
            className="w-full h-40 p-3 border rounded-lg mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            maxLength={500}
            autoFocus
          />
          
          <div className="flex justify-between text-sm text-gray-500 mb-6">
            <div>Admin will review your complaint</div>
            <div>{complaintText.length}/500</div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loadingComplaint}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
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

  // Complaints List Modal (keep the same)
  const ComplaintsListModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">My Complaints</h3>
          <button
            onClick={() => setShowComplaintsList(false)}
            className="text-gray-500 hover:text-gray-700"
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
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-yellow-700">{complaintStats.pending}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-green-700">{complaintStats.resolved}</div>
                <div className="text-sm text-green-600">Resolved</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-red-700">{complaintStats.dismissed}</div>
                <div className="text-sm text-red-600">Dismissed</div>
              </div>
            </div>

            <div className="space-y-3">
              {userComplaints.map((complaint) => (
                <div key={complaint.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
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
                      <p className="text-gray-700">{complaint.complaint_text}</p>
                      
                      {complaint.admin_reply && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
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

  // Main render
  return (
    <div className="min-h-screen flex bg-gray-50">
      {showComplaintBox && <ComplaintModal />}
      {showComplaintsList && <ComplaintsListModal />}
      
      <button
        onClick={() => setShowComplaintBox(true)}
        className="fixed bottom-6 right-6 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 z-40 flex items-center gap-2"
        title="Report an issue to admin"
      >
        <Flag size={20} />
        <span className="hidden sm:inline">Report Issue</span>
      </button>

      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-center border-b">
          <div className="h-20 w-20 mx-auto rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold">
            {user ? user.fullname[0] : "F"}
          </div>
          <h2 className="mt-3 font-bold text-lg text-gray-800">{user?.fullname || "Farmer"}</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.location || ""}</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <Link to="/farmer/dashboard" className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'dashboard' ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-100"}`}>Dashboard</Link>
          <Link to="/farmer/add-product" className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'addProduct' ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-100"}`}>Add Product</Link>
          <Link to="/farmer/products" className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'productList' ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-100"}`}>Product List</Link>
          <Link to="/farmer/orders" className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'orders' ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-100"}`}>Orders</Link>
          <Link to="/farmer/report" className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'reports' ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-100"}`}>Reports</Link>
          <Link to="/farmer/notifications" className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'notifications' ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-100"}`}>Notifications ({unreadCounts.notifications})</Link>
          
          <button
            onClick={() => setShowComplaintsList(true)}
            className="w-full text-left block text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-100 transition flex items-center justify-between"
          >
            <span>My Complaints</span>
            {complaintStats.total > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{complaintStats.total}</span>
            )}
          </button>
          
          <Link to="/farmer/messages" className="block w-full text-left px-4 py-2 rounded-lg font-semibold transition text-gray-700 hover:bg-green-100 relative">
            Messages
            {unreadCounts.messages > 0 && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {unreadCounts.messages > 9 ? '9+' : unreadCounts.messages}
              </span>
            )}
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">Welcome, {user?.fullname || "Farmer"}!</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => setShowComplaintsList(true)} className="relative text-gray-700 hover:text-red-600" title="View my complaints">
              <Flag className="w-6 h-6" />
              {complaintStats.pending > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">{complaintStats.pending}</span>
              )}
            </button>
            <Link to="/farmer/notifications" className="relative bg-white p-2 rounded-full hover:bg-gray-100 transition shadow-sm">
              <Bell className="w-6 h-6 text-green-600" />
              {unreadCounts.notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{unreadCounts.notifications > 9 ? '9+' : unreadCounts.notifications}</span>
              )}
            </Link>
            <Link to="/farmer/messages" className="relative bg-white p-2 rounded-full hover:bg-gray-100 transition shadow-sm">
              <MessageCircle className="w-6 h-6 text-green-600" />
              {unreadCounts.messages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{unreadCounts.messages > 9 ? '9+' : unreadCounts.messages}</span>
              )}
            </Link>
            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition shadow-sm">Logout</button>
          </div>
        </div>

        {activeTab === "dashboard" && user ? (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow mb-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">{user.fullname[0]}</div>
                <div className="flex flex-col space-y-1">
                  <h2 className="text-xl font-bold text-gray-800">{user.fullname}</h2>
                  <div className="flex items-center text-gray-600"><Mail className="w-4 h-4 mr-1 text-green-600" /><span>{user.email}</span></div>
                  <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-1 text-green-600" /><span>{user.location}</span></div>
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <Link to="/farmer/add-product" className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition"><Package size={16} /><span>Add Product</span></Link>
                <Link to="/farmer/orders" className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"><ShoppingCart size={16} /><span>View Orders</span></Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3"><Package className="w-8 h-8 text-green-600" /><span className="text-sm text-gray-500">Products</span></div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalProducts}</h3>
                <p className="text-sm text-gray-600 mt-1">Total products</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3"><ShoppingCart className="w-8 h-8 text-blue-600" /><span className="text-sm text-gray-500">Total Orders</span></div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalOrders}</h3>
                <p className="text-sm text-gray-600 mt-1">All orders</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3"><Clock className="w-8 h-8 text-yellow-600" /><span className="text-sm text-gray-500">New Orders</span></div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pendingOrders}</h3>
                <p className="text-sm text-gray-600 mt-1">Awaiting action</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-3"><Bell className="w-8 h-8 text-purple-600" /><span className="text-sm text-gray-500">Unread Notifications</span></div>
                <h3 className="text-2xl font-bold text-gray-800">{unreadCounts.notifications}</h3>
                <p className="text-sm text-gray-600 mt-1">Pending notifications</p>
              </div>
            </div>

            {recentOrders.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                  <Link to="/farmer/orders" className="text-green-600 hover:text-green-700 font-medium">View All →</Link>
                </div>
                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === 'placed' ? 'bg-blue-100' : order.status === 'preparing' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                          <span className="text-lg">{order.status === 'placed' ? '🛒' : order.status === 'preparing' ? '👨‍🌾' : '✅'}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Order #{order.id} • ₹{order.total_price}</h4>
                          <p className="text-sm text-gray-600">{order.consumer_name || `Customer ${order.consumer_id}`}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(order.order_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'placed' ? 'bg-blue-100 text-blue-800' : order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {order.status.toUpperCase()}
                        </span>
                        {order.status === 'placed' && (
                          <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Start Preparing</button>
                        )}
                        {order.status === 'preparing' && (
                          <button onClick={() => updateOrderStatus(order.id, 'ready')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">Mark Ready</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Activities</h2>
                <span className="text-sm text-green-600 font-medium">Showing 3 latest</span>
              </div>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8"><div className="text-gray-400 text-4xl mb-4">📋</div><p className="text-gray-500">No recent activities</p></div>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'order' ? 'bg-blue-100' : activity.type === 'message' ? 'bg-green-100' : activity.type === 'product' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                          <span className={`text-sm ${activity.type === 'order' ? 'text-blue-600' : activity.type === 'message' ? 'text-green-600' : activity.type === 'product' ? 'text-yellow-600' : 'text-gray-600'}`}>
                            {activity.type === 'order' ? '📦' : activity.type === 'message' ? '💬' : activity.type === 'product' ? '📝' : '🔔'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{activity.message}</h4>
                          <div className="flex items-center mt-1"><span className="text-xs px-2 py-1 rounded-full capitalize bg-gray-200 text-gray-700">{activity.type}</span></div>
                        </div>
                      </div>
                      <div className="text-right"><div className="flex items-center text-sm text-gray-500"><Clock className="w-3 h-3 mr-1" /><span>{activity.time}</span></div></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/farmer/add-product" className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition flex flex-col items-center justify-center text-center">
                  <Package className="w-6 h-6 mb-2" /><span className="font-medium">Add Product</span>
                </Link>
                <Link to="/farmer/orders" className="bg-white text-green-600 border border-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition flex flex-col items-center justify-center text-center">
                  <ShoppingCart className="w-6 h-6 mb-2" /><span className="font-medium">Manage Orders</span>
                </Link>
                <Link to="/farmer/messages" className="bg-white text-green-600 border border-green-600 py-3 px-4 rounded-lg hover:bg-green-50 transition flex flex-col items-center justify-center text-center">
                  <MessageCircle className="w-6 h-6 mb-2" /><span className="font-medium">Messages</span>
                </Link>
              </div>
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