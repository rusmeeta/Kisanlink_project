// OrderStatus.jsx - CONSUMER VERSION (Matches Farmer Orders Layout)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');

  // Format date like farmer orders page
  const formatDate = (dateString) => {
    if (!dateString) return "Today";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for status updates
  const formatMessageTime = (dateString) => {
    if (!dateString) return "Just now";
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get orders
  const getOrders = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        alert("Please login to view orders");
        return;
      }

      const response = await fetch(`http://localhost:5001/orders/consumer/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cancel order (if allowed)
  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const userId = localStorage.getItem("userId");
      
      const response = await fetch("https://kisanlink-project.onrender.com/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          consumer_id: userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`Order #${orderId} cancelled`);
          getOrders();
        }
      } else {
        alert("Cannot cancel order that has already been prepared");
      }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  // Get user name from localStorage
  useEffect(() => {
    const name = localStorage.getItem("userName") || "Customer";
    setUserName(name);
  }, []);

  // Initial load
  useEffect(() => {
    getOrders();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <Link to="/consumer/dashboard" style={{ color: "#16a34a", marginBottom: "10px", display: "block" }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "5px" }}>My Orders</h1>
        <p style={{ color: "#6b7280" }}>Track your order status in real-time</p>
        <div style={{ 
          backgroundColor: "#f0f9ff", 
          padding: "10px 15px", 
          borderRadius: "8px", 
          marginTop: "10px",
          display: "inline-block"
        }}>
          <span style={{ fontWeight: "600", color: "#0369a1" }}>Logged in as:</span> {userName}
        </div>
      </div>

      {/* Refresh Button */}
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={getOrders}
          disabled={loading}
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            fontSize: "14px",
            fontWeight: "600"
          }}
        >
          {loading ? "Loading..." : "Refresh Orders"}
        </button>
        <div style={{ marginTop: "10px", color: "#6b7280", fontSize: "14px" }}>
          <p>Orders update automatically when farmer changes status</p>
        </div>
      </div>

      {/* Orders Table - Same layout as farmer */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
        marginBottom: "30px"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f9fafb" }}>
            <tr>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Order ID
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Farmer
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Amount
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Status
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Date
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Last Updated
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px 16px", textAlign: "center" }}>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "40px 16px", textAlign: "center", color: "#6b7280" }}>
                  No orders yet. Start shopping!
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <div style={{ fontWeight: "600" }}>#{order.id}</div>
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <div>{order.farmer_name || "Farmer"}</div>
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <div style={{ fontWeight: "600" }}>₹{order.total_price || 0}</div>
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <div style={{ 
                      display: "inline-block", 
                      padding: "4px 12px", 
                      borderRadius: "12px", 
                      fontSize: "12px",
                      backgroundColor: 
                        order.status === 'placed' ? "#dbeafe" :
                        order.status === 'preparing' ? "#fef3c7" :
                        order.status === 'ready' ? "#ede9fe" :
                        order.status === 'delivered' ? "#dcfce7" : 
                        order.status === 'cancelled' ? "#fee2e2" : "#f3f4f6",
                      color: 
                        order.status === 'placed' ? "#1e40af" :
                        order.status === 'preparing' ? "#92400e" :
                        order.status === 'ready' ? "#5b21b6" :
                        order.status === 'delivered' ? "#166534" :
                        order.status === 'cancelled' ? "#991b1b" : "#374151"
                    }}>
                      {order.status}
                    </div>
                    {order.status === 'preparing' && (
                      <div style={{ fontSize: "12px", color: "#92400e", marginTop: "4px" }}>
                        Farmer is preparing your order
                      </div>
                    )}
                    {order.status === 'ready' && (
                      <div style={{ fontSize: "12px", color: "#5b21b6", marginTop: "4px" }}>
                        Ready for pickup/delivery
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                    {formatDate(order.order_date)}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                    {formatMessageTime(order.updated_at || order.order_date)}
                  </td>
                  <td style={{ padding: "16px" }}>
                    {/* Cancel button - only for placed orders */}
                    
                    
                    {/* View details button for all orders */}
                    <button
                      onClick={() => {
                        // Show order details in alert (you can replace with modal)
                        alert(`Order #${order.id}\nFarmer: ${order.farmer_name}\nStatus: ${order.status}\nTotal: ₹${order.total_price}\nDate: ${formatDate(order.order_date)}`);
                      }}
                      style={{
                        backgroundColor: "transparent",
                        color: "#3b82f6",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "1px solid #3b82f6",
                        cursor: "pointer",
                        fontSize: "14px",
                        marginLeft: order.status === 'placed' ? "10px" : "0"
                      }}
                    >
                      View Details
                    </button>
                    
                    {/* Status messages */}
                    {order.status === 'delivered' && (
                      <div style={{ color: "#16a34a", fontSize: "14px", marginTop: "5px" }}>
                        ✓ Order delivered
                      </div>
                    )}
                    
                    {order.status === 'cancelled' && (
                      <div style={{ color: "#ef4444", fontSize: "14px" }}>
                        ✗ Order cancelled
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Status Legend */}
      <div style={{ 
        backgroundColor: "#f8fafc", 
        padding: "20px", 
        borderRadius: "8px",
        border: "1px solid #e2e8f0"
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "15px", color: "#475569" }}>
          Order Status Guide
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#dbeafe" }}></div>
            <span style={{ fontSize: "14px" }}><strong>Placed:</strong> Order received by farmer</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#fef3c7" }}></div>
            <span style={{ fontSize: "14px" }}><strong>Preparing:</strong> Farmer is preparing your order</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ede9fe" }}></div>
            <span style={{ fontSize: "14px" }}><strong>Ready:</strong> Order ready for pickup/delivery</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#dcfce7" }}></div>
            <span style={{ fontSize: "14px" }}><strong>Delivered:</strong> Order completed</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: "20px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
        <p>Contact farmer directly for delivery/pickup questions</p>
        <p style={{ fontSize: "12px", marginTop: "5px" }}>Auto-refresh every 30 seconds</p>
      </div>
    </div>
  );
};

export default OrderStatus;