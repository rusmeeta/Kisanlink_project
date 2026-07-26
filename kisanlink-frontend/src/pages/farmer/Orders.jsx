// src/pages/farmer/Orders.jsx - SIMPLE TABLE
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const FarmerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get orders
  const getOrders = async () => {
    try {
      setLoading(true);
      const farmerId = localStorage.getItem("userId");
      
      const response = await fetch(`http://localhost:5001/orders/farmer/${farmerId}`, {
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

  // Update order status
  const updateOrder = async (orderId, newStatus) => {
    try {
      const farmerId = localStorage.getItem("userId");
      
      const response = await fetch(API_BASE/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          farmer_id: farmerId,
          new_status: newStatus
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`Order #${orderId} → ${newStatus}`);
          getOrders();
        }
      }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Today";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Initial load
  useEffect(() => {
    getOrders();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <Link to="/farmer/dashboard" style={{ color: "#16a34a", marginBottom: "10px", display: "block" }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "5px" }}>My Orders</h1>
        <p style={{ color: "#6b7280" }}>Track and manage customer orders</p>
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
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? "Loading..." : "Refresh Orders"}
        </button>
      </div>

      {/* Orders Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#f9fafb" }}>
            <tr>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Order ID
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "14px" }}>
                Customer
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
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: "40px 16px", textAlign: "center" }}>
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: "40px 16px", textAlign: "center", color: "#6b7280" }}>
                  No orders yet
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <div style={{ fontWeight: "600" }}>#{order.id}</div>
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <div>{order.consumer_name || "Customer"}</div>
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
                        order.status === 'delivered' ? "#dcfce7" : "#f3f4f6",
                      color: 
                        order.status === 'placed' ? "#1e40af" :
                        order.status === 'preparing' ? "#92400e" :
                        order.status === 'delivered' ? "#166534" : "#374151"
                    }}>
                      {order.status}
                    </div>
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                    {formatDate(order.order_date)}
                  </td>
                  <td style={{ padding: "16px" }}>
                    {order.status === 'placed' && (
                      <button
                        onClick={() => updateOrder(order.id, 'preparing')}
                        style={{
                          backgroundColor: "#f59e0b",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        Start Preparing
                      </button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrder(order.id, 'ready')}
                        style={{
                          backgroundColor: "#10b981",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        Mark as Ready
                      </button>
                    )}
                    
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrder(order.id, 'delivered')}
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px"
                        }}
                      >
                        Mark Delivered
                      </button>
                    )}
                    
                    {order.status === 'delivered' && (
                      <span style={{ color: "#16a34a", fontSize: "14px" }}>
                        ✓ Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div style={{ marginTop: "20px", textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
        <p>Click buttons to update order status</p>
      </div>
    </div>
  );
};

export default FarmerOrdersPage;
