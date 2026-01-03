// OrderStatus.jsx
import React, { useState, useEffect } from 'react';

import { formatMessageTime } from '../../utils/timeUtils';

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [userName, setUserName] = useState('Guest');

  // Function to set a test user ID
  

  // Check backend connection
  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:5001/orders/consumer/1', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setBackendStatus('connected');
        return true;
      } else {
        setBackendStatus('error');
        return false;
      }
    } catch (error) {
      console.error("Backend check failed:", error);
      setBackendStatus('not-responding');
      return false;
    }
  };

  // Fetch orders function
  const fetchOrders = async (consumerId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/orders/consumer/${consumerId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      // First check backend
      await checkBackend();
      
      // Then get user info from localStorage
      const storedId = localStorage.getItem('userId');
      const storedName = localStorage.getItem('userName');
      
      if (storedId) {
        setUserId(storedId);
      }
      
      if (storedName) {
        setUserName(storedName);
      }
      
      if (storedId) {
        fetchOrders(storedId);
      } else {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Refresh orders
  const refreshOrders = () => {
    if (userId) {
      fetchOrders(userId);
    } else {
      alert("Please set a user ID first!");
    }
  };

  // Inline styles to replace CSS file
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    },
    userInfo: {
      background: '#f5f5f5',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    userId: {
      fontWeight: 'bold',
      color: '#2ecc71'
    },
    userIdError: {
      fontWeight: 'bold',
      color: '#e74c3c'
    },
    controls: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px'
    },
    button: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s'
    },
    buttonTest: {
      background: '#3498db',
      color: 'white'
    },
    buttonRefresh: {
      background: '#2ecc71',
      color: 'white'
    },
    backendStatus: {
      background: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '30px',
      borderLeft: '4px solid #3498db'
    },
    statusConnected: {
      background: '#d4edda',
      color: '#155724',
      padding: '5px 10px',
      borderRadius: '4px',
      fontWeight: 'bold'
    },
    statusNotResponding: {
      background: '#f8d7da',
      color: '#721c24',
      padding: '5px 10px',
      borderRadius: '4px',
      fontWeight: 'bold'
    },
    statusChecking: {
      background: '#fff3cd',
      color: '#856404',
      padding: '5px 10px',
      borderRadius: '4px',
      fontWeight: 'bold'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      fontSize: '18px',
      color: '#7f8c8d'
    },
    noOrders: {
      textAlign: 'center',
      padding: '40px',
      background: '#f8f9fa',
      borderRadius: '8px',
      color: '#6c757d'
    },
    ordersList: {
      display: 'grid',
      gap: '20px'
    },
    orderCard: {
      background: 'white',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    orderItems: {
      marginTop: '15px',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '5px'
    },
    statusPlaced: {
      color: '#3498db',
      fontWeight: 'bold'
    },
    statusPreparing: {
      color: '#f39c12',
      fontWeight: 'bold'
    },
    statusReady: {
      color: '#9b59b6',
      fontWeight: 'bold'
    },
    statusDelivered: {
      color: '#27ae60',
      fontWeight: 'bold'
    }
  };

  // Get status style based on order status
  const getStatusStyle = (status) => {
    switch(status) {
      case 'placed': return styles.statusPlaced;
      case 'preparing': return styles.statusPreparing;
      case 'ready': return styles.statusReady;
      case 'delivered': return styles.statusDelivered;
      default: return {};
    }
  };

  // Get backend status display
  const getBackendStatusDisplay = () => {
    switch(backendStatus) {
      case 'connected': return '✅ Backend connected';
      case 'checking': return '🔍 Checking connection...';
      case 'not-responding': return '❌ Backend not responding';
      default: return '❌ Backend error';
    }
  };

  return (
    <div style={styles.container}>
      <h1>Order Status</h1>
      
      {/* User Info */}
      <div style={styles.userInfo}>
        <p>Welcome, {userName}</p>
        <p style={userId ? styles.userId : styles.userIdError}>
          User ID: {userId || "Not logged in"}
        </p>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        
        <button 
          onClick={refreshOrders} 
          style={{...styles.button, ...styles.buttonRefresh}}
        >
          Refresh
        </button>
      </div>

      {/* Backend Status */}
      

      {/* Orders List */}
      {loading ? (
        <div style={styles.loading}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={styles.noOrders}>
          <p>No orders found</p>
          {!userId && <p>Please set a user ID to see orders</p>}
          <p>Make sure backend is running on port 5001</p>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map(order => (
            <div key={order.id} style={styles.orderCard}>
              <h3>Order #{order.id}</h3>
              <p><strong>Farmer:</strong> {order.farmer_name || "Unknown Farmer"}</p>
              <p><strong>Status:</strong> <span style={getStatusStyle(order.status)}>{order.status}</span></p>
              <p><strong>Total:</strong> {order.total_price?.toFixed(2) || "0.00"}</p>
              <p><strong>Date:</strong> {order.order_date ? formatMessageTime(order.order_date) : "Unknown date"}</p>
              {order.items && order.items.length > 0 && (
                <div style={styles.orderItems}>
                  <h4>Items:</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {order.items.map((item, index) => (
                      <li key={index} style={{ marginBottom: '5px' }}>
                        {item.product_name || `Product ${index + 1}`} - {item.quantity}kg (${item.price?.toFixed(2) || "0.00"})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      
    </div>
  );
};

export default OrderStatus;