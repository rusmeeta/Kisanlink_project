import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Shield,
  TrendingUp,
  Bell,
  RefreshCw,
  AlertTriangle,
  Check,
  Clock,
  XCircle,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Menu,
  X,
  CheckSquare,
  XSquare,
  Eye,
  FileText
} from "lucide-react";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalConsumers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    activeFarmers: 0,
    totalUsers: 0,
    activeListings: 0
  });
  const [recentFarmers, setRecentFarmers] = useState([]);
  const [recentConsumers, setRecentConsumers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState({});
  const [adminName, setAdminName] = useState("Admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingProduct, setApprovingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    checkAdminAuth();
    loadDashboardData();
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

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load dashboard stats
      const statsResponse = await axios.get("http://localhost:5001/admin/stats", {
        withCredentials: true
      });
      setStats(statsResponse.data);

      // Load recent farmers
      const farmersResponse = await axios.get("http://localhost:5001/admin/recent-farmers", {
        withCredentials: true
      });
      setRecentFarmers(farmersResponse.data.farmers || []);

      // Load recent consumers
      const consumersResponse = await axios.get("http://localhost:5001/admin/recent-consumers", {
        withCredentials: true
      });
      setRecentConsumers(consumersResponse.data.consumers || []);

      // Load low stock products
      const lowStockResponse = await axios.get("http://localhost:5001/admin/low-stock-products", {
        withCredentials: true
      });
      
      if (lowStockResponse.data.success) {
        const criticalProducts = lowStockResponse.data.products?.filter(p => p.available_stock < 5) || [];
        setLowStockProducts(criticalProducts.slice(0, 3));
      }

      // Load pending products for approval
      const pendingResponse = await axios.get("http://localhost:5001/admin/products/pending", {
        withCredentials: true
      });
      
      if (pendingResponse.data.success) {
        setPendingProducts(pendingResponse.data.products?.slice(0, 3) || []);
      }

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      // Set fallback data
      setStats({
        totalFarmers: 8,
        totalConsumers: 1,
        totalProducts: 5,
        lowStockProducts: 0,
        pendingProducts: 3,
        approvedProducts: 2,
        activeFarmers: 8,
        totalUsers: 9,
        activeListings: 2
      });
    } finally {
      setLoading(false);
    }
  };

  const notifyFarmer = async (productId, farmerId) => {
    try {
      setNotifying(prev => ({ ...prev, [productId]: true }));
      
      const response = await axios.post(
        "http://localhost:5001/admin/notify-low-stock",
        { product_id: productId, farmer_id: farmerId },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        
        setLowStockProducts(prev => prev.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              notified: true,
              notified_at: new Date().toISOString(),
              notification_message: response.data.message
            };
          }
          return product;
        }));
      } else {
        alert(`❌ ${response.data.error || 'Failed to send notification'}`);
      }
      
    } catch (err) {
      console.error("Error notifying farmer:", err);
      alert("Error: " + err.message);
    } finally {
      setNotifying(prev => ({ ...prev, [productId]: false }));
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
        // Remove from pending list
        setPendingProducts(prev => prev.filter(p => p.id !== productId));
        // Update stats
        loadDashboardData();
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

  const rejectProduct = async () => {
    if (!selectedProduct || !rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setApprovingProduct(selectedProduct.id);
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
        // Remove from pending list
        setPendingProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
        // Update stats
        loadDashboardData();
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
      setApprovingProduct(null);
    }
  };

  const openRejectModal = (product) => {
    setSelectedProduct(product);
    setRejectReason("");
    setShowRejectModal(true);
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

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
          <p className="text-gray-600">Loading dashboard...</p>
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
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kisanlink Admin Panel</h1>
                <p className="text-xs text-gray-500">Madhyapur Thimi Municipality</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{adminName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome back, {adminName}. Here's a summary of your platform.</p>
        </div>

        {/* Dashboard Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Package className="h-4 w-4 inline mr-2" />
                Products ({stats.pendingProducts})
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Users
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-500 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || (stats.totalFarmers + stats.totalConsumers)}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
                        {stats.totalFarmers} Farmers
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {stats.totalConsumers} Consumers
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500 rounded-lg mr-4">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Products</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
                        {stats.approvedProducts} Approved
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        {stats.pendingProducts} Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-500 rounded-lg mr-4">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
                    <p className="text-sm text-yellow-700 mt-1">Low Stock Products</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-500 rounded-lg mr-4">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingProducts}</p>
                    <p className="text-sm text-orange-700 mt-1">Products Need Review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Quick Actions */}
              <div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Bell className="h-5 w-5 text-blue-600 mr-2" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                      to="/admin/products/pending"
                      className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100 group"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="font-medium text-gray-900">Review Products</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {stats.pendingProducts} products waiting for approval
                      </p>
                    </Link>
                    
                    <Link
                      to="/admin/products?filter=low-stock"
                      className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-100 group"
                    >
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                        <span className="font-medium text-gray-900">Low Stock Alerts</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {stats.lowStockProducts} products need attention
                      </p>
                    </Link>

                    <Link
                      to="/admin/farmers"
                      className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-100 group"
                    >
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-green-600 mr-3" />
                        <span className="font-medium text-gray-900">Manage Farmers</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        View and manage {stats.totalFarmers} farmers
                      </p>
                    </Link>

                    <Link
                      to="/admin/consumers"
                      className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-100 group"
                    >
                      <div className="flex items-center">
                        <ShoppingCart className="h-5 w-5 text-purple-600 mr-3" />
                        <span className="font-medium text-gray-900">Manage Consumers</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        View {stats.totalConsumers} consumer accounts
                      </p>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: Recent Activity */}
              <div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                    Recent Activity
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Pending Products Section */}
                    {pendingProducts.length > 0 && (
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <Clock className="h-4 w-4 text-orange-600 mr-2" />
                            Pending Approvals
                          </h4>
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            {pendingProducts.length} items
                          </span>
                        </div>
                        <div className="space-y-2">
                          {pendingProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-2 hover:bg-orange-100 rounded">
                              <div className="flex items-center">
                                <Package className="h-4 w-4 text-orange-600 mr-2" />
                                <span className="text-sm text-gray-700 truncate">{product.item_name}</span>
                              </div>
                              <span className="text-xs text-gray-500">{product.farmer_name}</span>
                            </div>
                          ))}
                        </div>
                        <Link to="/admin/products/pending" className="text-xs text-orange-600 hover:text-orange-800 font-medium mt-2 block">
                          Review all pending products →
                        </Link>
                      </div>
                    )}

                    {/* Low Stock Section */}
                    {lowStockProducts.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 flex items-center">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                            Critical Stock
                          </h4>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            {lowStockProducts.length} items
                          </span>
                        </div>
                        <div className="space-y-2">
                          {lowStockProducts.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-2 hover:bg-yellow-100 rounded">
                              <div className="flex items-center">
                                <Package className="h-4 w-4 text-yellow-600 mr-2" />
                                <span className="text-sm text-gray-700 truncate">{product.item_name}</span>
                              </div>
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                {product.available_stock} units
                              </span>
                            </div>
                          ))}
                        </div>
                        <Link to="/admin/products?filter=low-stock" className="text-xs text-yellow-600 hover:text-yellow-800 font-medium mt-2 block">
                          View all low stock items →
                        </Link>
                      </div>
                    )}

                    {/* Recent Farmers & Consumers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Users className="h-4 w-4 text-blue-600 mr-2" />
                          Recent Farmers
                        </h4>
                        <div className="space-y-2">
                          {recentFarmers.map((farmer) => (
                            <div key={farmer.id} className="flex items-center p-2 hover:bg-blue-100 rounded">
                              <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-xs text-blue-600 font-medium">
                                  {farmer.fullname?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm text-gray-700 truncate">{farmer.fullname}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <ShoppingCart className="h-4 w-4 text-purple-600 mr-2" />
                          Recent Consumers
                        </h4>
                        <div className="space-y-2">
                          {recentConsumers.map((consumer) => (
                            <div key={consumer.id} className="flex items-center p-2 hover:bg-purple-100 rounded">
                              <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-xs text-purple-600 font-medium">
                                  {consumer.fullname?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm text-gray-700 truncate">{consumer.fullname}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
              <div className="flex space-x-2">
                <Link
                  to="/admin/products"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  View All Products
                </Link>
                <Link
                  to="/admin/products/pending"
                  className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700"
                >
                  Pending Approvals ({stats.pendingProducts})
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Approvals Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Pending Approvals</h4>
                    <p className="text-sm text-gray-600">{stats.pendingProducts} products need review</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                    Action Required
                  </span>
                </div>
                
                {pendingProducts.length > 0 ? (
                  <div className="space-y-4">
                    {pendingProducts.map((product) => (
                      <div key={product.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center mb-3">
                          {product.photo_path ? (
                            <img
                              src={`http://localhost:5001/uploads/${product.photo_path}`}
                              alt={product.item_name}
                              className="h-12 w-12 object-cover rounded-lg mr-3"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                              <Package className="h-6 w-6 text-orange-600" />
                            </div>
                          )}
                          <div>
                            <h5 className="font-medium text-gray-900">{product.item_name}</h5>
                            <p className="text-sm text-gray-600">by {product.farmer_name}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">₹{product.price} • {product.location}</p>
                            <p className="text-xs text-gray-500">Stock: {product.available_stock} units</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => approveProduct(product.id)}
                              disabled={approvingProduct === product.id}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {approvingProduct === product.id ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => openRejectModal(product)}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Link to="/admin/products/pending" className="text-sm text-orange-600 hover:text-orange-800 font-medium block text-center">
                      View all pending products →
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-600">No pending approvals!</p>
                    <p className="text-sm text-gray-500">All products have been reviewed.</p>
                  </div>
                )}
              </div>

              {/* Low Stock Products Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Low Stock Alerts</h4>
                    <p className="text-sm text-gray-600">{stats.lowStockProducts} products need restocking</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    Monitor
                  </span>
                </div>
                
                {lowStockProducts.length > 0 ? (
                  <div className="space-y-4">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center mr-3">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">{product.item_name}</h5>
                              <p className="text-sm text-gray-600">{product.farmer_name}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            {product.available_stock} units
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">₹{product.price}</p>
                            <p className="text-xs text-gray-500">Threshold: 10 units</p>
                          </div>
                          <button
                            onClick={() => notifyFarmer(product.id, product.farmer_id)}
                            disabled={notifying[product.id]}
                            className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                          >
                            {notifying[product.id] ? 'Sending...' : 'Notify Farmer'}
                          </button>
                        </div>
                      </div>
                    ))}
                    <Link to="/admin/products?filter=low-stock" className="text-sm text-yellow-600 hover:text-yellow-800 font-medium block text-center">
                      View all low stock products →
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                    <p className="text-gray-600">All stocks are good!</p>
                    <p className="text-sm text-gray-500">No products below threshold.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Stats Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Product Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Total Products</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-gray-900">Approved</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedProducts}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="font-medium text-gray-900">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingProducts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <div className="flex space-x-2">
                <Link
                  to="/admin/farmers"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  Manage Farmers
                </Link>
                <Link
                  to="/admin/consumers"
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                >
                  Manage Consumers
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Farmers Overview */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-green-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900">Farmers Overview</h4>
                    <p className="text-sm text-gray-600">{stats.totalFarmers} registered farmers</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {stats.activeFarmers} Active
                  </span>
                </div>

                <div className="space-y-4">
                  {recentFarmers.map((farmer) => (
                    <div key={farmer.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-green-600 font-semibold">
                            {farmer.fullname?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{farmer.fullname}</p>
                          <p className="text-sm text-gray-600">{farmer.email}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                  ))}
                  <Link to="/admin/farmers" className="text-sm text-green-600 hover:text-green-800 font-medium block text-center">
                    View all farmers →
                  </Link>
                </div>
              </div>

              {/* Consumers Overview */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-semibold text-gray-900">Consumers Overview</h4>
                    <p className="text-sm text-gray-600">{stats.totalConsumers} registered consumers</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    All Active
                  </span>
                </div>

                <div className="space-y-4">
                  {recentConsumers.map((consumer) => (
                    <div key={consumer.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-purple-600 font-semibold">
                            {consumer.fullname?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{consumer.fullname}</p>
                          <p className="text-sm text-gray-600">{consumer.email}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                  ))}
                  <Link to="/admin/consumers" className="text-sm text-purple-600 hover:text-purple-800 font-medium block text-center">
                    View all consumers →
                  </Link>
                </div>
              </div>
            </div>

            {/* User Stats Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">User Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center mb-2">
                    <Users className="h-6 w-6 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">Total Users</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers || (stats.totalFarmers + stats.totalConsumers)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-blue-700">{stats.totalFarmers} farmers</span>
                    <span className="text-sm text-purple-700">{stats.totalConsumers} consumers</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    <span className="font-medium text-gray-900">Active Farmers</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeFarmers}</p>
                  <p className="text-sm text-green-700 mt-2">
                    {((stats.activeFarmers / stats.totalFarmers) * 100 || 0).toFixed(1)}% of all farmers
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center mb-2">
                    <ShoppingCart className="h-6 w-6 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-900">Active Consumers</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalConsumers}</p>
                  <p className="text-sm text-purple-700 mt-2">All consumers are active</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                <X className="h-5 w-5" />
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
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={rejectProduct}
                disabled={!rejectReason.trim() || approvingProduct === selectedProduct?.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approvingProduct === selectedProduct?.id ? "Rejecting..." : "Reject Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;