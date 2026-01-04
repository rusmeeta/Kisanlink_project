import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Package,
  DollarSign,
  Calendar,
  User,
  RefreshCw,
  AlertCircle,
  MapPin,
  Box,
  AlertTriangle,
  Clock,
  CheckSquare,
  XSquare,
  Edit
} from "lucide-react";

const ProductsManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [productToUpdate, setProductToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (!isAdminLoggedIn) {
      navigate("/admin");
      return;
    }
    
    checkAdminAuth();
    fetchProducts();
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

  const fetchProducts = async () => {
    try {
      console.log("🔍 Fetching products from backend...");
      setLoading(true);
      setError("");
      
      const res = await axios.get("http://localhost:5001/admin/products", {
        withCredentials: true,
        timeout: 10000
      });
      
      console.log("📦 Products API response:", res.data);
      
      if (res.data.success && Array.isArray(res.data.products)) {
        console.log(`✅ Found ${res.data.products.length} products from database`);
        setProducts(res.data.products);
        
        if (res.data.products.length === 0) {
          setError("No products found in database");
        }
      } else {
        console.error("❌ Unexpected response format:", res.data);
        setError("Failed to load products: Invalid response format");
        setProducts([]);
      }
      
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      setError(`Failed to load products: ${err.message}`);
      
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
        setError(`Server error: ${err.response.status} - ${err.response.data?.error || 'Unknown error'}`);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (productId, currentStatus) => {
    setProductToUpdate(productId);
    setNewStatus(currentStatus === "approved" ? "pending" : "approved");
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!productToUpdate || !newStatus) return;

    try {
      setActionLoading(prev => ({ ...prev, [productToUpdate]: 'updating' }));
      
      await axios.put(
        `http://localhost:5001/admin/products/${productToUpdate}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      fetchProducts();
      alert(`Product status updated to ${newStatus} successfully!`);
      
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product status");
    } finally {
      setActionLoading(prev => ({ ...prev, [productToUpdate]: false }));
      setShowStatusModal(false);
      setProductToUpdate(null);
      setNewStatus("");
    }
  };

  const handleDeleteClick = (productId, productName) => {
    setProductToDelete({ id: productId, name: productName });
    setShowDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setActionLoading(prev => ({ ...prev, [productToDelete.id]: 'deleting' }));
      
      await axios.delete(
        `http://localhost:5001/admin/products/${productToDelete.id}`,
        { withCredentials: true }
      );
      
      fetchProducts();
      alert(`Product "${productToDelete.name}" deleted successfully!`);
      
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    } finally {
      setActionLoading(prev => ({ ...prev, [productToDelete.id]: false }));
      setShowDeleteModal(false);
      setProductToDelete(null);
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
    
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status, isApproved) => {
    if (status === "approved" || isApproved) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center w-fit">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </span>
      );
    } else if (status === "rejected") {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center w-fit">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center w-fit">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    }
  };

  const getStockBadge = (stock) => {
    if (stock < 5) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          Critical: {stock}
        </span>
      );
    } else if (stock < 10) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
          Low: {stock}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          {stock} units
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products from database...</p>
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
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Products Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/products/pending"
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Pending Approvals
              </Link>
              <button
                onClick={fetchProducts}
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
              <h2 className="text-2xl font-bold text-gray-900">Manage Products</h2>
              <p className="text-gray-600">
                Total {products.length} products listed • Showing {filteredProducts.length} products
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Data fetched from PostgreSQL database
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by product name, farmer, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const isActionLoading = actionLoading[product.id];
              
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    {product.photo_path ? (
                      <img
                        src={`http://localhost:5001/uploads/${product.photo_path}`}
                        alt={product.item_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+UHJvZHVjdCBJbWFnZTwvdGV4dD4KPC9zdmc+';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                        <Package className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">No image</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(product.status, product.is_approved)}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize line-clamp-1">
                        {product.item_name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{product.farmer_name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{product.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-lg font-semibold text-gray-900">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          ₹{product.price}
                        </div>
                        <div className="flex items-center">
                          {getStockBadge(product.available_stock)}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-sm">
                        <p className="text-gray-500">Stock</p>
                        <p className="font-medium">{product.available_stock} units</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-500">Min Order</p>
                        <p className="font-medium">{product.min_order_qty} units</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewProductDetails(product)}
                        className="flex-1 py-2 px-3 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                        title="View Details"
                        disabled={isActionLoading}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange(product.id, product.status)}
                        className="flex-1 py-2 px-3 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                        title={product.status === "approved" ? "Mark as Pending" : "Approve"}
                        disabled={isActionLoading}
                      >
                        {isActionLoading === 'updating' ? (
                          <div className="h-4 w-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                        ) : product.status === "approved" ? (
                          <>
                            <XSquare className="h-4 w-4 mr-2" />
                            Unapprove
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClick(product.id, product.item_name)}
                        className="flex-1 py-2 px-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                        title="Delete"
                        disabled={isActionLoading}
                      >
                        {isActionLoading === 'deleting' ? (
                          <div className="h-4 w-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 py-12 text-center">
              <div className="text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Try adjusting your search or filter</p>
                <button
                  onClick={fetchProducts}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Products
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                <div className="h-64 bg-gray-100 rounded-xl overflow-hidden">
                  {selectedProduct.photo_path ? (
                    <img
                      src={`http://localhost:5001/uploads/${selectedProduct.photo_path}`}
                      alt={selectedProduct.item_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400 mb-4" />
                      <span className="text-gray-500">No image available</span>
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
                      {getStatusBadge(selectedProduct.status, selectedProduct.is_approved)}
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
                </div>

                {/* Farmer Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-gray-900 mb-2">Farmer Information</h5>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm">{selectedProduct.farmer_name}</span>
                    </div>
                    
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedProduct.id, selectedProduct.status);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    {selectedProduct.status === "approved" ? "Mark as Pending" : "Approve Product"}
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteClick(selectedProduct.id, selectedProduct.item_name);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete Product
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-center text-gray-700">
                Are you sure you want to delete <span className="font-semibold">"{productToDelete?.name}"</span>?
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                This action cannot be undone. All product data will be permanently removed.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={actionLoading[productToDelete?.id] === 'deleting'}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading[productToDelete?.id] === 'deleting' ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Product Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-center text-gray-700">
                Change product status to <span className="font-semibold">{newStatus}</span>?
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                This will {newStatus === "approved" ? "make the product visible to consumers" : "hide the product from consumers"}.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={actionLoading[productToUpdate] === 'updating'}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading[productToUpdate] === 'updating' ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;