// src/pages/farmer/Notifications.jsx - SIMPLE VERSION
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, RefreshCw, ArrowLeft, MessageCircle, ShoppingCart } from 'lucide-react';

const FarmerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:5001/notifications', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setNotifications(data.notifications || []);
        } else {
          setError(data.message || 'Failed to load notifications');
        }
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:5001/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  // In Notifications.jsx, update the handleNotificationClick function:

const handleNotificationClick = async (notification) => {
  // Mark as read
  if (!notification.is_read && notification.id) {
    await fetch(`http://localhost:5001/notifications/${notification.id}/read`, {
      method: 'POST',
      credentials: 'include'
    });
  }
  
  // Check if this is an order notification
  const message = notification.message.toLowerCase();
  if (message.includes('ordered') || message.includes('order placed')) {
    // Try to get consumer ID
    let consumerId = notification.consumer_id;
    
    // If consumer_id is not in notification, try to parse from order
    if (!consumerId && notification.order_id) {
      try {
        // Fetch order to get consumer_id
        const res = await fetch(`http://localhost:5001/orders/${notification.order_id}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const orderData = await res.json();
          consumerId = orderData.consumer_id;
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      }
    }
    
    if (consumerId) {
      // Open chat with consumer
      window.location.href = `/farmer/chat/${consumerId}`;
      return;
    }
  }
  
  // If no consumer ID or not an order notification, go to messages page
  window.location.href = '/farmer/messages';
};

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/farmer/dashboard"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
                  <p className="text-sm text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={loadNotifications}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <Link
                to="/farmer/messages"
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Messages</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-blue-600">Unread</p>
            <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-green-600">Orders</p>
            <p className="text-2xl font-bold text-gray-800">
              {notifications.filter(n => n.message?.toLowerCase().includes('ordered')).length}
            </p>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Notifications</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadNotifications}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Bell className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-600 mb-4">
                You'll see notifications here when customers place orders or send messages
              </p>
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-200 px-6 py-3">
                <h2 className="text-sm font-medium text-gray-500">
                  Recent Notifications ({notifications.length})
                </h2>
              </div>
              
              {/* SIMPLE NOTIFICATION LIST - All clickable */}
              {notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800">{notification.message}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                        
                        {/* Show if it's an order notification */}
                        {notification.message.toLowerCase().includes('ordered') && (
                          <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Order Notification - Click to chat
                          </div>
                        )}
                      </div>
                      
                      {!notification.is_read && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simple Instructions */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800 mb-2">How to use:</h3>
          <ul className="text-sm text-green-600 space-y-1">
            <li>• Click any order notification to chat with the customer</li>
            <li>• Click other notifications to view messages</li>
            <li>• New notifications have a blue background</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FarmerNotifications;