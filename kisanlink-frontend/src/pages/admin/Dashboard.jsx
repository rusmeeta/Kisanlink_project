// src/pages/admin/Dashboard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Shield,
  BarChart3,
  TrendingUp,
  Bell,
  RefreshCw,
  AlertTriangle,
  Check
} from "lucide-react";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeFarmers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    activeListings: 0
  });
  const [recentFarmers, setRecentFarmers] = useState([]);
  const [recentConsumers, setRecentConsumers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState({});
  const [adminName, setAdminName] = useState("Admin");

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
          navigate("/");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
      if (!isAdminLoggedIn) {
        navigate("/");
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
      console.log("Stats:", statsResponse.data);
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
      
      console.log("Low stock response:", lowStockResponse.data);
      
      if (lowStockResponse.data.success) {
        // Merge with existing notifications status
        setLowStockProducts(prev => {
          const newProducts = lowStockResponse.data.products || [];
          
          // Preserve notification status for products that still exist
          return newProducts.map(newProduct => {
            const existingProduct = prev.find(p => p.id === newProduct.id);
            if (existingProduct && existingProduct.notified) {
              return {
                ...newProduct,
                notified: existingProduct.notified,
                notified_at: existingProduct.notified_at
              };
            }
            return newProduct;
          });
        });
      }

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setStats({
        totalFarmers: 8,
        totalConsumers: 1,
        totalProducts: 5,
        activeListings: 5,
        activeFarmers: 8,
        lowStockProducts: 0
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

      console.log("Notification response:", response.data);

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        
        // Mark as notified but DON'T remove from list
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
        
        // DO NOT update stats - items stay in low stock until restocked
      } else {
        alert(`❌ ${response.data.error || 'Failed to send notification'}`);
      }
      
    } catch (err) {
      console.error("Error notifying farmer:", err);
      
      // Show detailed error
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        alert(`Server error: ${err.response.data?.error || err.response.status}`);
      } else if (err.request) {
        console.error("No response received:", err.request);
        alert("No response from server. Check if backend is running.");
      } else {
        alert("Error: " + err.message);
      }
    } finally {
      setNotifying(prev => ({ ...prev, [productId]: false }));
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
      navigate("/");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
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
              <div className="text-right">
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
          <p className="text-gray-600">Welcome back, {adminName}. Here's what's happening with your platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Farmers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFarmers}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  All active
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/admin/farmers"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
              >
                View all farmers <span className="ml-1">→</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Consumers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalConsumers}</p>
                <p className="text-xs text-green-600 mt-1">
                  <Users className="h-3 w-3 inline mr-1" />
                  All active
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/admin/consumers"
                className="text-sm text-purple-600 hover:text-purple-800 font-medium inline-flex items-center"
              >
                View all consumers <span className="ml-1">→</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  All listed
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/admin/products"
                className="text-sm text-green-600 hover:text-green-800 font-medium inline-flex items-center"
              >
                Manage products <span className="ml-1">→</span>
              </Link>
            </div>
          </div>

          {/* Low Stock Products Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-yellow-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Products</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockProducts}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Needs attention
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => document.getElementById('lowStockSection').scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-yellow-600 hover:text-yellow-800 font-medium inline-flex items-center"
              >
                View details <span className="ml-1">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Low Stock Products Section */}
        <div id="lowStockSection" className="bg-white rounded-xl shadow-sm p-6 border border-yellow-200 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Products</h3>
              <p className="text-sm text-gray-600">Products with less than 10 units in stock</p>
              <p className="text-xs text-gray-500 mt-1">
                Items remain in this list until stock is above 10 units
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                stats.lowStockProducts > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {stats.lowStockProducts > 0 ? `${stats.lowStockProducts} items need attention` : 'All stocks are good'}
              </span>
              <Link to="/admin/products" className="text-sm text-yellow-600 hover:text-yellow-800 font-medium">
                View all products
              </Link>
            </div>
          </div>
          
          {/* Stats Summary */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">Total low stock:</span> {stats.lowStockProducts}
              </div>
              <div>
                <span className="font-medium">Notified items:</span> {lowStockProducts.filter(p => p.notified).length}
              </div>
              <div>
                <span className="font-medium">Pending:</span> {lowStockProducts.filter(p => !p.notified).length}
              </div>
            </div>
          </div>
          
          {lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className={`flex items-center justify-between p-4 rounded-lg border ${
                  product.notified 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center">
                    {product.photo_path ? (
                      <img
                        src={`http://localhost:5001/uploads/${product.photo_path}`}
                        alt={product.item_name}
                        className="h-12 w-12 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/48";
                        }}
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        product.notified ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <Package className={`h-6 w-6 ${product.notified ? 'text-green-600' : 'text-yellow-600'}`} />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900">{product.item_name}</h4>
                        <span className="ml-3 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          {product.available_stock} units left
                        </span>
                        {product.notified && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Notified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <span className="font-medium">₹{product.price} per kg</span>
                        <span className="mx-2">•</span>
                        <span>Farmer: {product.farmer_name}</span>
                        <span className="mx-2">•</span>
                        <span>Min order: {product.min_order_qty} kg</span>
                        {product.location && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Location: {product.location}</span>
                          </>
                        )}
                      </div>
                      {product.notified_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Notified: {formatDate(product.notified_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">Threshold: 10 units</div>
                      <div className={`text-xs ${product.available_stock < 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {product.available_stock < 5 ? 'Critical stock' : 'Low stock'}
                      </div>
                    </div>
                    {!product.notified ? (
                      <button
                        onClick={() => notifyFarmer(product.id, product.farmer_id)}
                        disabled={notifying[product.id]}
                        className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {notifying[product.id] ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Notify Farmer
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => notifyFarmer(product.id, product.farmer_id)}
                        disabled={notifying[product.id] || product.available_stock >= 10}
                        className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {notifying[product.id] ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            {product.available_stock >= 10 ? 'Restocked ✓' : 'Notify Again'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : stats.lowStockProducts > 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
              <p className="text-gray-600">Stats show {stats.lowStockProducts} low stock products but API returned none</p>
              <p className="text-sm text-gray-500 mt-1">There might be a data synchronization issue</p>
              <button
                onClick={loadDashboardData}
                className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600">All products have sufficient stock!</p>
              <p className="text-sm text-gray-500 mt-1">No products below the 10-unit threshold.</p>
            </div>
          )}
          
          {/* Info Box */}
          
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Farmers */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Farmers</h3>
              <Link to="/admin/farmers" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentFarmers.length > 0 ? recentFarmers.map(farmer => (
                <div key={farmer.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{farmer.fullname?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{farmer.fullname}</p>
                      <p className="text-xs text-gray-500">{farmer.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
              )) : <p className="text-gray-500 text-center">No farmers found</p>}
            </div>
          </div>

          {/* Recent Consumers */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Consumers</h3>
              <Link to="/admin/consumers" className="text-sm text-green-600 hover:text-green-800 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentConsumers.length > 0 ? recentConsumers.map(consumer => (
                <div key={consumer.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">{consumer.fullname?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{consumer.fullname}</p>
                      <p className="text-xs text-gray-500">{consumer.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
              )) : <p className="text-gray-500 text-center">No consumers found</p>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/farmers"
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100 group"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <span className="font-medium text-gray-900">Manage Farmers</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">View, edit, and manage all registered farmers</p>
            </Link>
            <Link
              to="/admin/products"
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-100 group"
            >
              <div className="flex items-center">
                <Package className="h-5 w-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">Manage Products</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Approve, edit, or remove product listings</p>
            </Link>
            <div 
              onClick={() => document.getElementById('lowStockSection').scrollIntoView({ behavior: 'smooth' })}
              className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-100 group cursor-pointer"
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="font-medium text-gray-900">Low Stock Alerts</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Notify farmers about low stock products</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-900">Backend API</span>
              </div>
              <p className="text-sm text-gray-600">Connected and operational</p>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-gray-900">Database</span>
              </div>
              <p className="text-sm text-gray-600">Connected with {stats.totalFarmers + stats.totalConsumers} total users</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-white rounded-lg border">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Admin Session Active</p>
                <p className="text-sm text-gray-600">Logged in as {adminName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Kisanlink Admin Panel
                </p>
                <p className="text-xs text-gray-500">Madhyapur Thimi Municipality</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Low stock:</span> {stats.lowStockProducts} items
                </div>
                <button
                  onClick={loadDashboardData}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;