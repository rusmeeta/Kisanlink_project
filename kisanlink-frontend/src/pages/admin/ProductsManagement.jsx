import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  Box
} from "lucide-react";

const ProductsManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check frontend admin login
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (!isAdminLoggedIn) {
      navigate("/");
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
        navigate("/");
      }
    } catch (err) {
      console.error("Auth error:", err);
      localStorage.removeItem('adminLoggedIn');
      navigate("/");
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

  const handleStatusChange = async (productId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this product?`)) return;

    try {
      await axios.put(
        `http://localhost:5001/admin/products/${productId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      fetchProducts();
      alert(`Product ${newStatus} successfully!`);
      
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product status");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(
        `http://localhost:5001/admin/products/${productId}`,
        { withCredentials: true }
      );
      
      fetchProducts();
      alert("Product deleted successfully!");
      
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
            
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
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
                    
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize">
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
                    <div className="flex items-center text-sm font-semibold text-gray-900">
                      
                      ₹{product.price}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-sm">
                      <p className="text-gray-500">Stock</p>
                      <p className="font-medium">{product.available_stock}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-500">Min Order</p>
                      <p className="font-medium">{product.min_order_qty}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    
                    
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
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
    </div>
  );
};

export default ProductsManagement;