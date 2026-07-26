import React, { useState } from 'react';
import './FarmerOrderCard.css';

const FarmerOrderCard = ({ order, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  // Get current farmer ID from localStorage or context
  const farmerId = localStorage.getItem('userId') || localStorage.getItem('farmerId');
  
  const updateStatus = async (newStatus) => {
    if (!farmerId) {
      alert('Please login as farmer');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          farmer_id: parseInt(farmerId),
          new_status: newStatus
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Status updated to ${newStatus}`);
        if (onStatusUpdate) onStatusUpdate();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="order-card bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">Order #{order.id}</h3>
          <p className="text-gray-600 text-sm">
            Customer: {order.consumer_name || `User ${order.consumer_id}`}
          </p>
          <p className="text-gray-600 text-sm">
            {new Date(order.order_date).toLocaleDateString()} • {order.quantity} items
          </p>
        </div>
        
        <div className="text-right">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status.toUpperCase()}
          </div>
          <p className="font-bold text-lg mt-1">₹{order.total_price}</p>
        </div>
      </div>
      
      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
          <ul className="text-sm text-gray-600">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>{item.name || `Item ${item.product_id}`}</span>
                <span>{item.quantity} × ₹{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Status Update Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        {order.status === 'placed' && (
          <button
            onClick={() => updateStatus('preparing')}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Start Preparing'}
          </button>
        )}
        
        {order.status === 'preparing' && (
          <button
            onClick={() => updateStatus('ready')}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Mark as Ready'}
          </button>
        )}
        
        {order.status === 'ready' && order.delivery_type === 'delivery' && (
          <button
            onClick={() => updateStatus('out_for_delivery')}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Out for Delivery'}
          </button>
        )}
        
        {(order.status === 'ready' || order.status === 'out_for_delivery') && (
          <button
            onClick={() => updateStatus('delivered')}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Mark as Delivered'}
          </button>
        )}
        
        {(order.status === 'placed' || order.status === 'preparing') && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel this order?')) {
                updateStatus('cancelled');
              }
            }}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Cancel Order
          </button>
        )}
      </div>
      
      {order.status_updated_at && (
        <p className="text-xs text-gray-500 mt-3">
          Last updated: {new Date(order.status_updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default FarmerOrderCard;