import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  Shield,
  Bell,
  DollarSign,
  MapPin,
  Eye,
  ArrowRight,
  FileText,
  UserCheck,
  UserX,
  Percent,
  Activity,
  Edit2,
  Check,
  X
} from "lucide-react";
import axios from "axios";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalConsumers: 0,
    totalUsers: 0,
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    lowStockProducts: 0,
    criticalStockProducts: 0,
    outOfStockProducts: 0,
    activeFarmers: 0,
    recentProducts: 0
  });
  const [recentFarmers, setRecentFarmers] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [pendingEditRequests, setPendingEditRequests] = useState([]);
  const [selectedEditRequest, setSelectedEditRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe, setTimeframe] = useState("today");
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    checkAdminAuth();
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const checkAdminAuth = async () => {
    try {
      const response = await axios.get("http://localhost:5001/admin/check-auth", {
        withCredentials: true
      });

      if (response.data.authenticated) {
        setAdminName(response.data.name || "Admin");
      } else {
        navigate("/admin");
      }
    } catch (err) {
      navigate("/admin");
    }
  };

  const loadEditRequests = async () => {
    try {
      const response = await axios.get("http://localhost:5001/admin/edit-requests/pending", {
        withCredentials: true
      });
      if (response.data.success) {
        setPendingEditRequests(response.data.edit_requests || []);
      }
    } catch (err) {
      console.error("Error loading edit requests:", err);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats
      const statsResponse = await axios.get("http://localhost:5001/admin/stats", {
        withCredentials: true
      });
      
      if (statsResponse.data.success) {
        setStats(statsResponse.data);
      }

      // Load recent farmers
      const farmersResponse = await axios.get("http://localhost:5001/admin/recent-farmers", {
        withCredentials: true
      });
      setRecentFarmers(farmersResponse.data.farmers || []);

      // Load recent products
      const productsResponse = await axios.get("http://localhost:5001/admin/recent-products", {
        withCredentials: true
      });
      setRecentProducts(productsResponse.data.products || []);

      // Load pending edit requests
      await loadEditRequests();

    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEditRequest = async (requestId) => {
    try {
      setIsProcessing(true);
      const response = await axios.post(
        `http://localhost:5001/admin/edit-requests/${requestId}/approve`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert("Edit request approved successfully!");
        loadEditRequests();
        loadDashboardData(); // Refresh stats
        setSelectedEditRequest(null);
      }
    } catch (err) {
      console.error("Error approving edit request:", err);
      alert(err.response?.data?.error || "Error approving edit request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectEditRequest = async (requestId) => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await axios.post(
        `http://localhost:5001/admin/edit-requests/${requestId}/reject`,
        { reason: rejectReason },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        alert("Edit request rejected!");
        loadEditRequests();
        loadDashboardData(); // Refresh stats
        setSelectedEditRequest(null);
        setRejectReason("");
      }
    } catch (err) {
      console.error("Error rejecting edit request:", err);
      alert(err.response?.data?.error || "Error rejecting edit request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5001/admin/logout", {}, {
        withCredentials: true
      });
    } finally {
      localStorage.clear();
      navigate("/admin");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const StatCard = ({ title, value, change, icon, color, link }) => (
    <div className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${link ? 'cursor-pointer hover:border-blue-300' : ''}`}
         onClick={link ? () => navigate(link) : undefined}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          {icon}
        </div>
      </div>
      {link && (
        <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
          View details <ArrowRight className="h-4 w-4 ml-1" />
        </div>
      )}
    </div>
  );

  const QuickAction = ({ title, description, icon, color, link, badge }) => (
    <Link to={link} className="block">
      <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            {icon}
          </div>
          {badge && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.color}`}>
              {badge.text}
            </span>
          )}
        </div>
        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="mt-4 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Take action <ArrowRight className="h-4 w-4 ml-1" />
        </div>
      </div>
    </Link>
  );

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
                <h1 className="text-xl font-bold text-gray-900">Kisanlink Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Welcome back, {adminName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
        {/* Timeframe Filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              <p className="text-gray-600">Real-time insights into your platform</p>
            </div>
            <div className="flex space-x-2 bg-white rounded-lg p-1 border">
              {['today', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize ${
                    timeframe === period
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            change={12}
            icon={<Users className="h-6 w-6 text-blue-600" />}
            color="bg-blue-100"
            link="/admin/farmers"
          />
          
          <StatCard
            title="Active Products"
            value={stats.approvedProducts}
            change={8}
            icon={<Package className="h-6 w-6 text-green-600" />}
            color="bg-green-100"
            link="/admin/products"
          />
          
          <StatCard
            title="Pending Approvals"
            value={stats.pendingProducts + pendingEditRequests.length}
            change={-3}
            icon={<Clock className="h-6 w-6 text-orange-600" />}
            color="bg-orange-100"
            link="/admin/products/pending"
          />
          
          <StatCard
            title="Low Stock Alerts"
            value={stats.lowStockProducts}
            change={5}
            icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
            color="bg-red-100"
            link="/admin/low-stock-products"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              title="Review Products"
              description={`${stats.pendingProducts} products awaiting approval`}
              icon={<FileText className="h-6 w-6 text-orange-600" />}
              color="bg-orange-100"
              link="/admin/products/pending"
              badge={{ text: "Action Required", color: "bg-orange-100 text-orange-800" }}
            />
            
            <QuickAction
              title="Review Edits"
              description={`${pendingEditRequests.length} edit requests pending`}
              icon={<Edit2 className="h-6 w-6 text-blue-600" />}
              color="bg-blue-100"
              link="/admin/edit-requests"
              badge={{ 
                text: `${pendingEditRequests.length} Pending`, 
                color: "bg-blue-100 text-blue-800" 
              }}
            />
            
            <QuickAction
              title="Stock Alerts"
              description={`${stats.lowStockProducts} products need attention`}
              icon={<Bell className="h-6 w-6 text-red-600" />}
              color="bg-red-100"
              link="/admin/low-stock-products"
              badge={{ text: `${stats.criticalStockProducts} Critical`, color: "bg-red-100 text-red-800" }}
            />
            
            <QuickAction
              title="Manage Farmers"
              description={`Manage ${stats.totalFarmers} farmer accounts`}
              icon={<UserCheck className="h-6 w-6 text-green-600" />}
              color="bg-green-100"
              link="/admin/farmers"
            />
          </div>
        </div>

        {/* Pending Edit Requests Section */}
        {pendingEditRequests.length > 0 && (
          <div id="edit-requests" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Edit Requests</h3>
                <p className="text-sm text-gray-600">
                  {pendingEditRequests.length} product edit{pendingEditRequests.length !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
              <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                Action Required
              </div>
            </div>
            
            <div className="space-y-4">
              {pendingEditRequests.slice(0, 3).map((request) => (
                <div key={request.request_id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <Edit2 className="h-4 w-4 text-blue-600 mr-2" />
                        <h4 className="font-medium text-gray-900">
                          {request.current_data.item_name} → {request.proposed_data.item_name}
                        </h4>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Farmer:</span>
                          {request.farmer_name}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Price:</span>
                          ₹{request.current_data.price} → ₹{request.proposed_data.price}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Requested:</span>
                          {formatDateTime(request.requested_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => setSelectedEditRequest(request)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleApproveEditRequest(request.request_id)}
                        disabled={isProcessing}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm flex items-center"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {pendingEditRequests.length > 3 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => {/* You can create a separate page for all edit requests */}}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all {pendingEditRequests.length} edit requests →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Stats & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Platform Health */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Health</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Status */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 text-gray-400 mr-2" />
                    Product Status
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Approved</span>
                      <div className="flex items-center">
                        <span className="font-semibold">{stats.approvedProducts}</span>
                        <div className="ml-2 h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(stats.approvedProducts / stats.totalProducts) * 100 || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Review</span>
                      <div className="flex items-center">
                        <span className="font-semibold">{stats.pendingProducts}</span>
                        <div className="ml-2 h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${(stats.pendingProducts / stats.totalProducts) * 100 || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pending Edits</span>
                      <div className="flex items-center">
                        <span className="font-semibold">{pendingEditRequests.length}</span>
                        <div className="ml-2 h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(pendingEditRequests.length / stats.totalProducts) * 100 || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rejected</span>
                      <div className="flex items-center">
                        <span className="font-semibold">{stats.rejectedProducts || 0}</span>
                        <div className="ml-2 h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${(stats.rejectedProducts / stats.totalProducts) * 100 || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Status */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Activity className="h-5 w-5 text-gray-400 mr-2" />
                    Stock Status
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">In Stock</span>
                      <span className="font-semibold text-green-600">
                        {stats.approvedProducts - stats.lowStockProducts - (stats.outOfStockProducts || 0)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Low Stock</span>
                      <span className="font-semibold text-yellow-600">{stats.lowStockProducts}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Critical</span>
                      <span className="font-semibold text-red-600">{stats.criticalStockProducts}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Out of Stock</span>
                      <span className="font-semibold text-gray-600">{stats.outOfStockProducts || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Products */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
                <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all products →
                </Link>
              </div>
              
              {recentProducts.length > 0 ? (
                <div className="space-y-4">
                  {recentProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{product.item_name}</h4>
                          <p className="text-sm text-gray-600">{product.farmer_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{product.price}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No recent products</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - User Stats & Quick Links */}
          <div>
            {/* User Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">User Statistics</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Farmers</p>
                      <p className="text-sm text-gray-600">{stats.totalFarmers} active accounts</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">{stats.totalFarmers}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <ShoppingCart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Consumers</p>
                      <p className="text-sm text-gray-600">{stats.totalConsumers} active buyers</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{stats.totalConsumers}</span>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Platform Users</span>
                    <span className="font-semibold text-gray-900">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Active Farmers</span>
                    <span className="font-semibold text-green-600">{stats.activeFarmers}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              
              <div className="space-y-3">
                <Link to="/admin/products/pending" className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-orange-600 mr-3" />
                    <span className="font-medium text-gray-900">Review Products</span>
                  </div>
                  <div className="flex items-center">
                    {stats.pendingProducts > 0 && (
                      <span className="mr-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {stats.pendingProducts}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600" />
                  </div>
                </Link>
                
                {pendingEditRequests.length > 0 && (
                  <button
                    onClick={() => document.getElementById('edit-requests')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <div className="flex items-center">
                      <Edit2 className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="font-medium text-gray-900">Review Edits</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {pendingEditRequests.length}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                )}
                
                <Link to="/admin/low-stock-products" className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors group">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <span className="font-medium text-gray-900">Low Stock Alerts</span>
                  </div>
                  <div className="flex items-center">
                    {stats.lowStockProducts > 0 && (
                      <span className="mr-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {stats.lowStockProducts}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                  </div>
                </Link>
                
                <Link to="/admin/farmers" className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900">Manage Farmers</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">System Status: All systems operational</p>
                <p className="text-xs text-blue-700">Last updated: Just now</p>
              </div>
            </div>
            <button
              onClick={loadDashboardData}
              className="flex items-center text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh data
            </button>
          </div>
        </div>
      </div>

      {/* Edit Request Detail Modal */}
      {selectedEditRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Request Details</h3>
                  <p className="text-gray-600">Request ID: {selectedEditRequest.request_id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedEditRequest(null);
                    setRejectReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Current Data */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                    <AlertTriangle size={18} className="mr-2" />
                    Current Product Data
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{selectedEditRequest.current_data.item_name}</p>
                    </div>
                    <div className="flex items-center">
                      <DollarSign size={14} className="mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600 mr-2">Price:</span>
                      <p className="font-medium">₹{selectedEditRequest.current_data.price}</p>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600 mr-2">Location:</span>
                      <p className="font-medium">{selectedEditRequest.current_data.location}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Stock:</span>
                      <p className="font-medium">{selectedEditRequest.current_data.available_stock} units</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Min Order:</span>
                      <p className="font-medium">{selectedEditRequest.current_data.min_order_qty} units</p>
                    </div>
                  </div>
                </div>

                {/* Proposed Data */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                    <Edit2 size={18} className="mr-2" />
                    Proposed Changes
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <p className="font-medium">{selectedEditRequest.proposed_data.item_name}</p>
                    </div>
                    <div className="flex items-center">
                      <DollarSign size={14} className="mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600 mr-2">Price:</span>
                      <p className="font-medium">₹{selectedEditRequest.proposed_data.price}</p>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600 mr-2">Location:</span>
                      <p className="font-medium">{selectedEditRequest.proposed_data.location}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Stock:</span>
                      <p className="font-medium">{selectedEditRequest.proposed_data.available_stock} units</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Min Order:</span>
                      <p className="font-medium">{selectedEditRequest.proposed_data.min_order_qty} units</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Farmer Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Farmer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium">{selectedEditRequest.farmer_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-medium">{selectedEditRequest.farmer_email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Farmer ID:</span>
                    <p className="font-medium">{selectedEditRequest.farmer_id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Product ID:</span>
                    <p className="font-medium">{selectedEditRequest.product_id}</p>
                  </div>
                </div>
              </div>

              {/* Rejection Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Rejection Reason (if rejecting)</h4>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  rows="3"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedEditRequest(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectEditRequest(selectedEditRequest.request_id)}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} className="inline mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleApproveEditRequest(selectedEditRequest.request_id)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check size={18} className="inline mr-2" />
                      Approve Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;