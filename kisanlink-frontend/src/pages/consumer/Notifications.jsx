// src/pages/consumer/Notifications.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:5001";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/notifications/`, {
        credentials: "include",
      });
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${BACKEND_URL}/notifications/${notificationId}/read`, {
        method: "POST",
        credentials: "include",
      });

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // In Notifications.jsx, update the handleNotificationClick function:
const handleNotificationClick = async (notification) => {
  console.log("Notification clicked:", notification);
  
  if (!notification.is_read) {
    await markAsRead(notification.id);
  }

  if (notification.farmer_id) {
    const farmerName = notification.farmer_name || 
                      extractNameFromMessage(notification.message) || 
                      `Farmer ${notification.farmer_id}`;
    
    console.log("Navigating to messages with farmer ID:", notification.farmer_id);
    
    // Navigate to /consumer/messages/:farmerId route
    navigate(`/consumer/messages/${notification.farmer_id}`, { 
      state: { 
        farmer_name: farmerName
      } 
    });
  } else if (notification.order_id) {
    navigate('/consumer/orders');
  } else if (notification.target_role === 'farmer') {
    navigate('/consumer/dashboard');
  } else {
    navigate('/consumer/dashboard');
  }
};

// Helper function to extract name from notification message
const extractNameFromMessage = (message) => {
  if (!message) return null;

  // Try to find farmer name in message
  const nameMatch = message.match(/Farmer (\w+ \w+)/) ||
    message.match(/farmer (\w+ \w+)/i) ||
    message.match(/from (\w+ \w+)/i);

  return nameMatch ? nameMatch[1] : null;
};

const markAllAsRead = async () => {
  try {
    await fetch(`${BACKEND_URL}/notifications/mark-all-read`, {
      method: "POST",
      credentials: "include",
    });
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, is_read: true }))
    );
  } catch (err) {
    console.error(err);
  }
};

const deleteNotification = async (notificationId, e) => {
  e.stopPropagation();
  try {
    await fetch(`${BACKEND_URL}/notifications/${notificationId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  } catch (err) {
    console.error(err);
  }
};

const clearAllNotifications = async () => {
  try {
    await fetch(`${BACKEND_URL}/notifications/clear-all`, {
      method: "DELETE",
      credentials: "include",
    });
    setNotifications([]);
  } catch (err) {
    console.error(err);
  }
};

// Filter notifications
const filteredNotifications = notifications.filter(notif => {
  if (activeTab === "unread") return !notif.is_read;
  if (activeTab === "read") return notif.is_read;
  return true;
});

// Counts
const unreadCount = notifications.filter(notif => !notif.is_read).length;
const readCount = notifications.filter(notif => notif.is_read).length;

// Get notification icon
const getNotificationIcon = (notification) => {
  if (notification.farmer_id) return "💬";
  if (notification.order_id) return "📦";
  if (notification.message?.toLowerCase().includes('order')) return "🛒";
  if (notification.message?.toLowerCase().includes('price')) return "💰";
  if (notification.message?.toLowerCase().includes('delivery')) return "🚚";
  if (notification.message?.toLowerCase().includes('success')) return "✅";
  return "🔔";
};

// Format time
const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Notifications</h1>
            <p className="text-green-600 mt-2">Stay updated with your farming activities</p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium transform hover:scale-105 active:scale-95"
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium transform hover:scale-105 active:scale-95"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-5 rounded-xl shadow-lg border border-green-100 transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <span className="text-2xl">🔔</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-lg border border-green-100 transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-2xl">📩</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-gray-800">{unreadCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-lg border border-green-100 transform transition-transform hover:scale-105">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <span className="text-2xl">📖</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Read</p>
                <p className="text-2xl font-bold text-gray-800">{readCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === "all"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === "unread"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Unread ({unreadCount})
            {unreadCount > 0 && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("read")}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === "read"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Read ({readCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center transform transition-all duration-300">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
            <span className="text-4xl">🔕</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {activeTab === "all"
              ? "No notifications yet"
              : activeTab === "unread"
                ? "No unread notifications"
                : "No read notifications"}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === "all"
              ? "You're all caught up! New notifications will appear here."
              : "Nothing to show in this section."}
          </p>
          <button
            onClick={() => navigate('/consumer/dashboard')}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium transform hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif, index) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`bg-white rounded-xl shadow-sm border cursor-pointer transform transition-all duration-200 hover:shadow-md hover:scale-[1.005] hover:translate-x-1 overflow-hidden ${!notif.is_read ? 'border-l-4 border-l-green-500' : 'border-gray-200'
                }`}
            >
              <div className="p-4 flex items-start">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${!notif.is_read ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                  <span className="text-2xl">{getNotificationIcon(notif)}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="text-xs text-gray-400">
                        {formatTime(notif.created_at)}
                      </span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {notif.farmer_id && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Farmer {notif.farmer_name || notif.farmer_id}
                      </span>
                    )}
                    {notif.order_id && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Order #{notif.order_id}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      Click to {notif.farmer_id ? 'reply' : 'view'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-center ml-3 space-y-2">
                  {!notif.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 transform hover:scale-110 transition-transform"
                      title="Mark as read"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => deleteNotification(notif.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600 transform hover:scale-110 transition-transform"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State Badge */}
      {notifications.length === 0 && !loading && (
        <div className="fixed bottom-6 right-6">
          <div className="flex items-center space-x-2 bg-white rounded-full shadow-lg px-4 py-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">No new notifications</span>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default Notifications;