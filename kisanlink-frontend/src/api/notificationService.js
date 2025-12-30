// src/api/notificationService.js
const API_URL = process.env.REACT_APP_API_URL || '';

// Fetch all notifications
export const fetchNotifications = async () => {
  try {
    console.log("Fetching notifications from:", `${API_URL}/notifications`);
    const response = await fetch(`${API_URL}/notifications`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Notifications response:", data);
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Create test notifications
export const createTestNotifications = async () => {
  try {
    const response = await fetch(`${API_URL}/notifications/test-data`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to create test notifications');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating test notifications:', error);
    throw error;
  }
};

// Get current user info
export const getCurrentUser = () => {
  return {
    id: localStorage.getItem('user_id'),
    type: localStorage.getItem('user_type'),
    name: localStorage.getItem('user_name')
  };
};