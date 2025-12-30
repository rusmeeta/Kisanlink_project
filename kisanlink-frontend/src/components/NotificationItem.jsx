// src/components/NotificationItem.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShoppingCart, MessageCircle, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const NotificationItem = ({ notification, currentUserType }) => {
  const [isRead, setIsRead] = useState(notification.is_read || false);
  
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
  
  // Get notification type based on message
  const getNotificationType = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('ordered') || lowerMessage.includes('order placed')) {
      return 'order';
    } else if (lowerMessage.includes('delivered') || lowerMessage.includes('completed')) {
      return 'delivery';
    } else if (lowerMessage.includes('message') || lowerMessage.includes('chat')) {
      return 'message';
    } else if (lowerMessage.includes('cancelled') || lowerMessage.includes('failed')) {
      return 'cancelled';
    }
    return 'info';
  };
  
  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-5 h-5" />;
      case 'delivery':
        return <CheckCircle className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'cancelled':
        return <Package className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };
  
  // Get notification color
  const getNotificationColor = (type) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-600';
      case 'delivery':
        return 'bg-green-100 text-green-600';
      case 'message':
        return 'bg-purple-100 text-purple-600';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Mark notification as read
  const markAsRead = async () => {
    if (!isRead && notification.id) {
      try {
        const response = await fetch(`http://localhost:5001/notifications/${notification.id}/read`, {
          method: 'POST',
          credentials: 'include'
        });
        
        if (response.ok) {
          setIsRead(true);
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };
  
  // Extract consumer ID from notification message (simple parsing)
  const extractConsumerId = () => {
    // Try to get consumer_id from notification object
    if (notification.consumer_id) {
      return notification.consumer_id;
    }
    
    // If not available, try to parse from message
    // This is a fallback - ideally consumer_id should come from backend
    const message = notification.message || '';
    const match = message.match(/customer[ _]?(\d+)/i) || 
                  message.match(/consumer[ _]?(\d+)/i) ||
                  message.match(/user[ _]?(\d+)/i);
    
    return match ? match[1] : null;
  };
  
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Mark as read
    await markAsRead();
    
    // Get consumer ID
    const consumerId = extractConsumerId();
    
    // If we have a consumer ID and it's an order notification, go to chat
    const notificationType = getNotificationType(notification.message);
    
    if (consumerId && notificationType === 'order') {
      // Redirect to chat with consumer
      window.location.href = `/farmer/chat/${consumerId}`;
    } else if (notification.order_id) {
      // If it has order_id but no consumer_id, try to get consumer info first
      try {
        const res = await fetch(`http://localhost:5001/orders/${notification.order_id}/consumer`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.consumer_id) {
            window.location.href = `/farmer/chat/${data.consumer_id}`;
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching consumer info:', err);
      }
      
      // Fallback: go to messages page
      window.location.href = '/farmer/messages';
    } else {
      // Go to general messages page
      window.location.href = '/farmer/messages';
    }
  };
  
  const notificationType = getNotificationType(notification.message);
  
  return (
    <div 
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
        !isRead ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notificationType)}`}>
            {getNotificationIcon(notificationType)}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-sm font-medium text-gray-900">
                {notificationType === 'order' ? 'New Order' : 
                 notificationType === 'delivery' ? 'Order Delivered' :
                 notificationType === 'message' ? 'New Message' :
                 'Notification'}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTimeAgo(notification.created_at)}
                </span>
                {!isRead && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    New
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-2">
              <span className="inline-flex items-center text-xs font-medium text-green-600 hover:text-green-700 cursor-pointer">
                <MessageCircle className="w-3 h-3 mr-1" />
                Chat with Customer
              </span>
              
              {notification.order_id && (
                <span className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  View Order
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;