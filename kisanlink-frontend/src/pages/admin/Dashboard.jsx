// src/pages/admin/Dashboard.jsx
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
  Calendar,
  RefreshCw
} from "lucide-react";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeFarmers: 0,
    totalProducts: 0,
    pendingApprovals: 0,
    activeListings: 0
  });
  const [recentFarmers, setRecentFarmers] = useState([]);
  const [recentConsumers, setRecentConsumers] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    checkAdminAuth();
    loadDashboardData();
  }, [navigate]);

  const checkAdminAuth = async () => {
    try {
      // Check backend authentication
      const response = await axios.get("http://localhost:5001/admin/check-auth", {
        withCredentials: true
      });

      if (response.data.authenticated) {
        setAdminName(response.data.name || "Admin");
      } else {
        // If backend fails, check localStorage
        const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
        if (!isAdminLoggedIn) {
          navigate("/");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      // Check localStorage as fallback
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

      // Load recent products
      const productsResponse = await axios.get("http://localhost:5001/admin/recent-products", {
        withCredentials: true
      });
      setRecentProducts(productsResponse.data.products || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      // Set fallback data if API fails
      setStats({
        totalFarmers: 8,
        totalConsumer:1,
        totalProducts: 5,
        activeListings: 5,
        activeFarmers: 8,
        pendingApprovals: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call backend logout
      await axios.post("http://localhost:5001/admin/logout", {}, {
        withCredentials: true
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear frontend storage
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminName');
      navigate("/");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeListings}</p>
                <p className="text-xs text-green-600 mt-1">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  All approved
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/admin/products"
                className="text-sm text-yellow-600 hover:text-yellow-800 font-medium inline-flex items-center"
              >
                Review listings <span className="ml-1">→</span>
              </Link>
            </div>
          </div>

          
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
                  
                </div>
              )) : <p className="text-gray-500 text-center">No consumers found</p>}
            </div>
          </div>
        </div>


        {/* Recent Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
            <Link
              to="/admin/products"
              className="text-sm text-green-600 hover:text-green-800 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    {product.photo_path ? (
                      <img
                        src={`http://localhost:5001/uploads/${product.photo_path}`}
                        alt={product.item_name}
                        className="h-10 w-10 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{product.item_name}</p>
                      <p className="text-xs text-gray-500">₹{product.price} • {product.farmer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    
                    
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No products found</p>
              </div>
            )}
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
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-3" />
              <span className="font-medium text-gray-900">Platform Analytics</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Coming soon: Detailed insights and reports</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
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
            <p className="text-sm text-gray-600">Connected with {stats.totalFarmers} users</p>
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
    

      {/* Footer */ }
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
          <span className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </span>
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
    </div >
  );
};

export default AdminDashboard;