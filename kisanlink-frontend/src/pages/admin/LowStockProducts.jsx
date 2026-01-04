import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Eye,
  AlertCircle,
  RefreshCw,
  Package,
  Bell,
  ArrowLeft,
  Shield,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  AlertTriangle,
  Trash2,
  Edit
} from "lucide-react";

const LowStockProducts = () => {
  const navigate = useNavigate();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (!isAdminLoggedIn) {
      navigate("/admin");
      return;
    }
    
    checkAdminAuth();
    fetchLowStockProducts();
  }, [navigate]);

  const checkAdminAuth = async () => {
    try {
      const res = await axios.get("http://localhost:5001/admin/check-auth", {
        withCredentials: true
      });
      
      if (!res.data.authenticated) {
        localStorage.removeItem('adminLoggedIn');
        navigate("/admin");
      }
    } catch (err) {
      console.error("Auth error:", err);
      localStorage.removeItem('adminLoggedIn');
      navigate("/admin");
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      console.log("🔍 Fetching low stock products...");
      setLoading(true);
      setError("");
      
      const res = await axios.get("http://localhost:5001/admin/low-stock-products", {
        withCredentials: true,
        timeout: 10000
      });
      
      console.log("📦 Low stock products API response:", res.data);
      
      if (res.data.success && Array.isArray(res.data.products)) {
        console.log(`✅ Found ${res.data.products.length} low stock products`);
        setLowStockProducts(res.data.products);
      } else {
        console.error("❌ Unexpected response format:", res.data);
        setError("Failed to load low stock products: Invalid response format");
        setLowStockProducts([]);
      }
      
    } catch (err) {
      console.error("❌ Error fetching low stock products:", err);
      setError(`Failed to load low stock products: ${err.message}`);
      setLowStockProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyFarmer = async (product) => {
    try {
      setActionLoading(prev => ({ ...prev, [product.id]: 'notifying' }));
      
      const response = await axios.post(
        "http://localhost:5001/admin/notify-low-stock",
        {
          product_id: product.id,
          farmer_id: product.farmer_id
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        fetchLowStockProducts();
      } else {
        alert(`❌ ${response.data.error || 'Failed to notify farmer'}`);
      }
      
    } catch (err) {
      console.error("Error notifying farmer:", err);
      
      if (err.response && err.response.data && err.response.data.error) {
        alert(`Failed to notify farmer: ${err.response.data.error}`);
      } else {
        alert("Failed to notify farmer. Please try again.");
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const handleViewNotificationHistory = async (product) => {
    try {
      setHistoryLoading(true);
      setSelectedProduct(product);
      
      const response = await axios.get(
        `http://localhost:5001/admin/products/${product.id}/notification-history`,
        {
          withCredentials: true,
          timeout: 10000
        }
      );
      
      if (response.data.success) {
        setNotificationHistory(response.data.notifications);
      } else {
        alert(`❌ ${response.data.error || 'Failed to load notification history'}`);
        setNotificationHistory([]);
      }
      
    } catch (err) {
      console.error("Error fetching notification history:", err);
      alert("Failed to load notification history. Please try again.");
      setNotificationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete || !deleteReason.trim()) {
      alert("Please provide a deletion reason");
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [productToDelete.id]: 'deleting' }));
      
      const response = await axios.delete(
        `http://localhost:5001/admin/products/${productToDelete.id}/delete-low-stock`,
        {
          data: { reason: deleteReason },
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        fetchLowStockProducts();
        setShowDeleteModal(false);
        setProductToDelete(null);
        setDeleteReason("");
      } else {
        alert(`❌ ${response.data.error || 'Failed to delete product'}`);
      }
      
    } catch (err) {
      console.error("Error deleting product:", err);
      
      if (err.response && err.response.data && err.response.data.error) {
        alert(`Failed to delete product: ${err.response.data.error}`);
      } else {
        alert("Failed to delete product. Please try again.");
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [productToDelete.id]: false }));
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) {
      return {
        text: "Out of Stock",
        color: "bg-gray-100 text-gray-800",
        borderColor: "border-gray-200",
        icon: <XCircle className="h-4 w-4 mr-1" />
      };
    } else if (stock < 5) {
      return {
        text: "Critical",
        color: "bg-red-100 text-red-800",
        borderColor: "border-red-200",
        icon: <AlertCircle className="h-4 w-4 mr-1" />
      };
    } else if (stock < 10) {
      return {
        text: "Low",
        color: "bg-yellow-100 text-yellow-800",
        borderColor: "border-yellow-200",
        icon: <AlertCircle className="h-4 w-4 mr-1" />
      };
    }
    return {
      text: "Good",
      color: "bg-green-100 text-green-800",
      borderColor: "border-green-200",
      icon: <CheckCircle className="h-4 w-4 mr-1" />
    };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not read yet";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading low stock products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Low Stock Products</h1>
                  <p className="text-xs text-gray-500">Monitor, notify farmers, or remove products</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchLowStockProducts}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Low Stock Products</h2>
              <p className="text-gray-600">
                {lowStockProducts.length} products need attention • Showing {lowStockProducts.length} products
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Threshold: 10 units
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg mr-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Critical Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lowStockProducts.filter(p => p.available_stock < 5 && p.available_stock > 0).length}
                </p>
                <p className="text-xs text-gray-500">Below 5 units</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lowStockProducts.filter(p => p.available_stock >= 5 && p.available_stock < 10).length}
                </p>
                <p className="text-xs text-gray-500">5-9 units</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg mr-4">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lowStockProducts.filter(p => p.available_stock <= 0).length}
                </p>
                <p className="text-xs text-gray-500">Zero units</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lowStockProducts.length}
                </p>
                <p className="text-xs text-gray-500">Needs attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Products Grid */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Low Stock Products</h3>
          
          {lowStockProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lowStockProducts.map((product) => {
                const status = getStockStatus(product.available_stock);
                const isActionLoading = actionLoading[product.id];
                const isOutOfStock = product.available_stock <= 0;
                
                return (
                  <div key={product.id} className={`border ${status.borderColor} rounded-lg p-5 hover:shadow-md transition-shadow`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{product.item_name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{product.farmer_name}</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full items-center ${status.color}`}>
                          {status.icon}
                          {status.text}: {product.available_stock} units
                        </span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Stock:</span>
                        <span className={`font-medium ${isOutOfStock ? 'text-red-600' : ''}`}>
                          {product.available_stock} units
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Min Order Qty:</span>
                        <span className="font-medium">{product.min_order_qty} units</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{product.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Threshold:</span>
                        <span className="font-medium">10 units</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-4 border-t">
                      <button
                        onClick={() => handleViewNotificationHistory(product)}
                        className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        History
                      </button>
                      <button
                        onClick={() => handleNotifyFarmer(product)}
                        disabled={isActionLoading || isOutOfStock}
                        className="flex-1 py-2 px-3 bg-yellow-50 text-yellow-700 rounded-lg font-medium hover:bg-yellow-100 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        {isActionLoading === 'notifying' ? (
                          <>
                            <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Notify
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => openDeleteModal(product)}
                        disabled={isActionLoading === 'deleting'}
                        className="flex-1 py-2 px-3 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm flex items-center justify-center disabled:opacity-50"
                        title="Remove from low stock list"
                      >
                        {isActionLoading === 'deleting' ? (
                          <>
                            <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Low Stock Products</h4>
              <p className="text-gray-600 mb-4">All products have sufficient stock levels.</p>
              <button
                onClick={fetchLowStockProducts}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Stock Status
              </button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-800 mb-1">About Low Stock Management</h5>
              <p className="text-sm text-blue-700">
                • <strong>Notify Farmer:</strong> Send alerts to farmers about low stock<br/>
                • <strong>View History:</strong> See all previous notifications for each product<br/>
                • <strong>Delete Product:</strong> Remove products that cannot be restocked<br/>
                • <strong>Critical:</strong> Below 5 units • <strong>Low:</strong> 5-9 units • <strong>Out:</strong> 0 units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Product Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Low Stock Product</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                  setDeleteReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Product: <span className="font-medium">{productToDelete.item_name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Farmer: <span className="font-medium">{productToDelete.farmer_name}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Current Stock: <span className="font-medium">{productToDelete.available_stock} units</span>
              </p>
              
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-700">
                    This action will permanently delete the product. The farmer will be notified.
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deletion Reason *
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explain why this product is being deleted (e.g., Cannot restock, Discontinued, Quality issues)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be shared with the farmer in the notification.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                  setDeleteReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={!deleteReason.trim() || actionLoading[productToDelete.id] === 'deleting'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading[productToDelete.id] === 'deleting' ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification History Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Notification History</h3>
                  <p className="text-sm text-gray-600">
                    {selectedProduct.item_name} • {selectedProduct.farmer_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setNotificationHistory([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Product:</p>
                    <p className="font-medium">{selectedProduct.item_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Current Stock:</p>
                    <p className="font-medium">{selectedProduct.available_stock} units</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Farmer:</p>
                    <p className="font-medium">{selectedProduct.farmer_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Stock Status:</p>
                    <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStockStatus(selectedProduct.available_stock).color}`}>
                      {getStockStatus(selectedProduct.available_stock).text}
                    </span>
                  </div>
                </div>
              </div>

              {historyLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading notification history...</p>
                </div>
              ) : notificationHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Sent Notifications</h4>
                    <span className="text-sm text-gray-500">
                      {notificationHistory.length} notification{notificationHistory.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {notificationHistory.map((notification, index) => (
                      <div key={notification.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              Low Stock Alert #{index + 1}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {notification.is_read ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Unread
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded">
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Sent: {formatDateTime(notification.created_at)}</span>
                          </div>
                          {notification.is_read && (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span>Read: {formatDateTime(notification.read_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Notifications Sent</h4>
                  <p className="text-gray-600 mb-4">
                    No low stock alerts have been sent for this product yet.
                  </p>
                  <button
                    onClick={() => handleNotifyFarmer(selectedProduct)}
                    disabled={actionLoading[selectedProduct.id]}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading[selectedProduct.id] === 'notifying' ? "Sending..." : "Send First Alert"}
                  </button>
                </div>
              )}

              <div className="flex space-x-3 pt-6 border-t mt-6">
                <button
                  onClick={() => handleNotifyFarmer(selectedProduct)}
                  disabled={actionLoading[selectedProduct.id]}
                  className="flex-1 py-2 px-4 bg-yellow-50 text-yellow-700 rounded-lg font-medium hover:bg-yellow-100 transition-colors disabled:opacity-50"
                >
                  {actionLoading[selectedProduct.id] === 'notifying' ? "Sending..." : "Send New Alert"}
                </button>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setNotificationHistory([]);
                  }}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LowStockProducts;