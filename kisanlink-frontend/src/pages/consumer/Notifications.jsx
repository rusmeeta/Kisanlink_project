// src/pages/consumer/Notifications.jsx - FIXED VERSION
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, RefreshCw, ArrowLeft, MessageCircle, ShoppingCart, Check } from 'lucide-react';

const BACKEND_URL = API_BASE";

const ConsumerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const navigate = useNavigate();

  // Load notifications - SORTED BY LATEST FIRST
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${BACKEND_URL}/notifications/`, {
        credentials: "include",
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded notifications:', data);
        
        if (data.status === 'success') {
          // Sort notifications by created_at in descending order (newest first)
          const sortedNotifications = (data.notifications || [])
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setNotifications(sortedNotifications);
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
  }, []);

  // Mark notification as read - FIXED VERSION
  const markNotificationAsRead = async (notificationId) => {
    if (isMarkingRead) return;
    
    setIsMarkingRead(true);
    
    try {
      // Update local state FIRST for immediate UI feedback
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      
      // Then send API request
      const response = await fetch(`${BACKEND_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      console.log('Mark as read response:', result);
      
      if (!response.ok || result.status !== 'success') {
        console.error('Failed to mark notification as read on server:', result.message);
        // Reload notifications to sync with server if failed
        loadNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Reload on error
      loadNotifications();
    } finally {
      setIsMarkingRead(false);
    }
  };

  // Mark all notifications as read
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

  // Handle notification click - FIXED VERSION
  const handleNotificationClick = async (notification) => {
    console.log('Clicked notification:', notification);
    
    // Mark as read if unread
    if (!notification.is_read && notification.id) {
      console.log('Marking as read:', notification.id);
      await markNotificationAsRead(notification.id);
    }
    
    // Check if this is an order notification or has farmer_id
    const message = notification.message?.toLowerCase() || '';
    const isOrderNotification = message.includes('ordered') || 
                               message.includes('order placed') || 
                               notification.order_id;
    
    // For consumers: chat_with_id should be farmer_id
    const chatWithId = notification.chat_with_id || notification.farmer_id;
    
    if (isOrderNotification && chatWithId) {
      console.log('Order notification with farmer ID:', chatWithId);
      
      // Small delay to ensure read status is saved before navigation
      setTimeout(() => {
        navigate(`/consumer/chat/${chatWithId}`, { 
          state: { 
            farmer_name: notification.chat_with_name || 
                        extractNameFromMessage(notification.message) || 
                        `Farmer ${chatWithId}` 
          } 
        });
      }, 300);
      return;
    } else if (chatWithId) {
      // Non-order notification but has farmer to chat with
      setTimeout(() => {
        navigate(`/consumer/chat/${chatWithId}`);
      }, 300);
      return;
    } else if (notification.order_id) {
      // Order notification without chat - go to orders
      setTimeout(() => {
        navigate('/consumer/orders');
      }, 300);
      return;
    }
    
    // If no chat ID or not an order notification, just mark as read
    // and stay on the notifications page
    console.log('Non-order notification clicked, staying on page');
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

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    
    try {
      let date;
      if (dateString.includes('Z')) {
        date = new Date(dateString);
      } else if (dateString.includes('+')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString + 'Z');
      }
      
      if (isNaN(date.getTime())) {
        return "Recently";
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins === 1) return "1 min ago";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours === 1) return "1 hour ago";
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return "Recently";
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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
                to="/consumer/dashboard"
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
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <Link
                to="/consumer/messages"
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
          <div className={`rounded-lg shadow-sm p-4 transition-colors duration-300 ${unreadCount > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-500'}`}>Unread</p>
            <p className={`text-2xl font-bold ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-800'}`}>
              {unreadCount}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <p className="text-sm text-green-600">Orders</p>
            <p className="text-2xl font-bold text-gray-800">
              {notifications.filter(n => 
                n.message?.toLowerCase().includes('ordered') || 
                n.message?.toLowerCase().includes('order placed') ||
                n.order_id
              ).length}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Mark all as read</span>
              </button>
            )}
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
                You'll see notifications here when you place orders or receive messages
              </p>
              <button
                onClick={() => navigate('/consumer/dashboard')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div>
              <div className="border-b border-gray-200 px-6 py-3">
                <h2 className="text-sm font-medium text-gray-500">
                  Recent Notifications ({notifications.length})
                </h2>
              </div>
              
              {/* NOTIFICATION LIST */}
              {notifications.map((notification, index) => {
                const isOrderNotification = notification.message?.toLowerCase().includes('ordered') || 
                                          notification.message?.toLowerCase().includes('order placed') ||
                                          notification.order_id;
                const chatWithId = notification.chat_with_id || notification.farmer_id;
                
                return (
                  <div
                    key={notification.id || index}
                    className={`border-b border-gray-100 transition-all duration-200 cursor-pointer ${
                      !notification.is_read 
                        ? 'bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    } ${isMarkingRead ? 'opacity-70' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start">
                            <p className="text-gray-800 flex-1">{notification.message}</p>
                            {isMarkingRead && (
                              <div className="ml-2 animate-spin">
                                <RefreshCw className="w-4 h-4 text-green-600" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          
                          {/* Show if it's an order notification */}
                          {isOrderNotification && (
                            <div className="mt-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              {chatWithId 
                                ? `Order from ${notification.chat_with_name || 'Farmer'} - Click to chat`
                                : 'Order Notification'}
                            </div>
                          )}
                          
                          {/* Show if it has farmer to chat with */}
                          {chatWithId && !isOrderNotification && (
                            <div className="mt-2 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Click to chat with {notification.chat_with_name || 'Farmer'}
                            </div>
                          )}
                          
                          {/* Debug info - remove in production */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="mt-1 text-xs text-gray-400">
                              ID: {notification.id} | 
                              Read: {notification.is_read ? 'Yes' : 'No'} | 
                              Chat ID: {chatWithId || 'none'}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          {!notification.is_read ? (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full transition-colors duration-300 flex items-center">
                              <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                              New
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 px-2 py-1 transition-colors duration-300 flex items-center">
                              <Check className="w-3 h-3 mr-1 text-green-500" />
                              Read
                            </span>
                          )}
                          
                          {/* Visual indicator */}
                          <div className={`w-3 h-3 rounded-full border ${
                            notification.is_read 
                              ? 'bg-gray-100 border-gray-300' 
                              : 'bg-green-500 border-green-600 animate-pulse'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        

      
        
      </div>
    </div>
  );
};

export default ConsumerNotifications;
