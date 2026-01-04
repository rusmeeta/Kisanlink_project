// src/components/admin/PendingProducts.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Package,
  DollarSign,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  FileText,
  AlertTriangle
} from "lucide-react";

const PendingProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState("");
  const [approvingProduct, setApprovingProduct] = useState(null);
  const [rejectingProduct, setRejectingProduct] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0
  });
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    checkAdminAuth();
    fetchPendingProducts();
  }, [navigate]);

  const checkAdminAuth = async () => {
    try {
      const response = await axios.get("http://localhost:5001/admin/check-auth", {
        withCredentials: true
      });

      if (response.data.authenticated) {
        setAdminName(response.data.name || "Admin");
      } else {
        const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
        if (!isAdminLoggedIn) {
          navigate("/admin");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
      if (!isAdminLoggedIn) {
        navigate("/admin");
      }
    }
  };

  const fetchPendingProducts = async () => {
    try {
      console.log("🔍 Fetching pending products from backend...");
      setLoading(true);
      setError("");
      
      const res = await axios.get("http://localhost:5001/admin/products/pending", {
        withCredentials: true,
        timeout: 10000
      });
      
      console.log("📦 Pending products API response:", res.data);
      
      if (res.data.success && Array.isArray(res.data.products)) {
        console.log(`✅ Found ${res.data.products.length} pending products from database`);
        setProducts(res.data.products);
        setStats({
          total: res.data.count || res.data.products.length,
          approved: 0,
          rejected: 0
        });
        
        if (res.data.products.length === 0) {
          setError("No pending products found");
        }
      } else {
        console.error("❌ Unexpected response format:", res.data);
        setError("Failed to load pending products: Invalid response format");
        setProducts([]);
      }
      
    } catch (err) {
      console.error("❌ Error fetching pending products:", err);
      setError(`Failed to load pending products: ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (productId) => {
    try {
      setApprovingProduct(productId);
      const response = await axios.post(
        `http://localhost:5001/admin/products/${productId}/approve`,
        {},
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        // Remove from list
        setProducts(prev => prev.filter(p => p.id !== productId));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
      } else {
        alert(`❌ ${response.data.error || 'Failed to approve product'}`);
      }
    } catch (err) {
      console.error("Error approving product:", err);
      alert("Error: " + err.message);
    } finally {
      setApprovingProduct(null);
    }
  };

  const openRejectModal = (product) => {
    setSelectedProduct(product);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const rejectProduct = async () => {
    if (!selectedProduct || !rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setRejectingProduct(selectedProduct.id);
      const response = await axios.post(
        `http://localhost:5001/admin/products/${selectedProduct.id}/reject`,
        { reason: rejectReason },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        // Remove from list
        setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
        setStats(prev => ({ ...prev, total: prev.total - 1 }));
        // Close modal and reset
        setShowRejectModal(false);
        setSelectedProduct(null);
        setRejectReason("");
      } else {
        alert(`❌ ${response.data.error || 'Failed to reject product'}`);
      }
    } catch (err) {
      console.error("Error rejecting product:", err);
      alert("Error: " + err.message);
    } finally {
      setRejectingProduct(null);
    }
  };

  const viewProductDetails = (product) => {
    setSelectedProduct(product);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
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

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5001/admin/logout", {}, {
        withCredentials: true
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminName');
      navigate("/admin");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending products...</p>
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
              <Link
                to="/admin/dashboard"
                className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Kisanlink Admin Panel</h1>
                  <p className="text-xs text-gray-500">Pending Products Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{adminName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
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
              <h2 className="text-2xl font-bold text-gray-900">Pending Product Approvals</h2>
              <p className="text-gray-600">
                {stats.total} products awaiting approval • Showing {filteredProducts.length} products
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/products"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" />
                All Products
              </Link>
              <button
                onClick={fetchPendingProducts}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-yellow-700">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-orange-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by product name, farmer, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Product Image */}
                    <div className="md:w-48 md:h-48 h-40 w-full bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.photo_path ? (
                        <img
                          src={`http://localhost:5001/uploads/${product.photo_path}`}
                          alt={product.item_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 capitalize">
                            {product.item_name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <User className="h-4 w-4 mr-2" />
                            <span>by {product.farmer_name}</span>
                            <span className="mx-2">•</span>
                            <Mail className="h-4 w-4 mr-2" />
                            <span className="text-blue-600">{product.farmer_email}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            Pending Review
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">{product.location}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="text-xl font-bold text-green-600">₹{product.price}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Available Stock</p>
                            <p className="font-medium">{product.available_stock} units</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Listed On</p>
                            <p className="font-medium">{formatDate(product.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <button
                          onClick={() => approveProduct(product.id)}
                          disabled={approvingProduct === product.id}
                          className="flex-1 py-3 px-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {approvingProduct === product.id ? (
                            <>
                              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Approve Product
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => openRejectModal(product)}
                          className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Reject Product
                        </button>
                        
                        <button
                          onClick={() => viewProductDetails(product)}
                          className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Products</h3>
              <p className="text-gray-600 mb-6">All products have been reviewed and approved.</p>
              <div className="flex justify-center space-x-4">
                <Link
                  to="/admin/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={fetchPendingProducts}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && !showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Product Image */}
                <div className="h-80 bg-gray-100 rounded-xl overflow-hidden">
                  {selectedProduct.photo_path ? (
                    <img
                      src={`http://localhost:5001/uploads/${selectedProduct.photo_path}`}
                      alt={selectedProduct.item_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Package className="h-20 w-20 text-gray-400 mb-4" />
                      <span className="text-gray-500 text-lg">No image available</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                    {selectedProduct.item_name}
                  </h4>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-gray-600">
                      <User className="h-5 w-5 mr-2" />
                      <span className="font-medium">{selectedProduct.farmer_name}</span>
                    </div>
                    <div className="flex items-center text-2xl font-bold text-green-600">
                      <DollarSign className="h-6 w-6" />
                      {selectedProduct.price}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="font-medium">{selectedProduct.location || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <div className="flex items-center">
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                        Pending Approval
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Available Stock</p>
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <p className="font-medium">{selectedProduct.available_stock} units</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Minimum Order Quantity</p>
                    <p className="font-medium">{selectedProduct.min_order_qty} units</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Listed On</p>
                    <p className="font-medium">{formatDate(selectedProduct.created_at)}</p>
                  </div>
                </div>

                {/* Farmer Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-2">Farmer Information</h5>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm">{selectedProduct.farmer_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm">{selectedProduct.farmer_email}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Farmer ID: {selectedProduct.farmer_id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => approveProduct(selectedProduct.id)}
                    disabled={approvingProduct === selectedProduct.id}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {approvingProduct === selectedProduct.id ? 'Approving...' : 'Approve Product'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(null);
                      openRejectModal(selectedProduct);
                    }}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Reject Product
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Product</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Product: <span className="font-medium">{selectedProduct?.item_name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Farmer: <span className="font-medium">{selectedProduct?.farmer_name}</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this product is being rejected..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be shared with the farmer.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={rejectProduct}
                disabled={!rejectReason.trim() || rejectingProduct === selectedProduct?.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {rejectingProduct === selectedProduct?.id ? "Rejecting..." : "Reject Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingProducts;