// src/pages/admin/ConsumersManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  Mail,
  MapPin,
  Calendar,
  RefreshCw,
  UserCircle,
  ShoppingBag
} from "lucide-react";

const ConsumersManagement = () => {
  const navigate = useNavigate();
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check frontend admin login
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (!isAdminLoggedIn) {
      navigate("/");
      return;
    }
    
    checkAdminAuth();
    fetchConsumers();
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

  const fetchConsumers = async () => {
    try {
      console.log("🔍 Fetching consumers from backend...");
      setLoading(true);
      setError("");
      
      const res = await axios.get("http://localhost:5001/admin/consumers", {
        withCredentials: true,
        timeout: 10000
      });
      
      console.log("📦 Consumers API response:", res.data);
      
      if (res.data.success && Array.isArray(res.data.consumers)) {
        console.log(`✅ Found ${res.data.consumers.length} consumers from database`);
        setConsumers(res.data.consumers);
      } else {
        console.error("❌ Unexpected response format:", res.data);
        setError("Failed to load consumers: Invalid response format");
        setConsumers([]);
      }
      
    } catch (err) {
      console.error("❌ Error fetching consumers:", err);
      setError(`Failed to load consumers: ${err.message}`);
      setConsumers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConsumer = async (consumerId) => {
    if (!window.confirm("Are you sure you want to delete this consumer? This action cannot be undone.")) return;

    try {
      await axios.delete(
        `http://localhost:5001/admin/users/${consumerId}`,
        { withCredentials: true }
      );
      
      fetchConsumers();
      alert("Consumer deleted successfully!");
      
    } catch (err) {
      console.error("Error deleting consumer:", err);
      
      // Show specific error message from backend
      if (err.response && err.response.data && err.response.data.error) {
        alert(`Failed to delete consumer: ${err.response.data.error}`);
      } else {
        alert("Failed to delete consumer. Please try again.");
      }
    }
  };

  const viewConsumerDetails = (consumer) => {
    setSelectedConsumer(consumer);
  };

  const filteredConsumers = consumers.filter((consumer) => {
    const matchesSearch = 
      (consumer.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consumer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consumer.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || consumer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleString('en-US', {
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
          <p className="text-gray-600">Loading consumers from database...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Consumers Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchConsumers}
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
              <h2 className="text-2xl font-bold text-gray-900">Manage Consumers</h2>
              <p className="text-gray-600">
                Total {consumers.length} consumers registered • Showing {filteredConsumers.length} consumers
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Data fetched from PostgreSQL database
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
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
                placeholder="Search by name, email, or location..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Consumers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consumer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsumers.length > 0 ? (
                  filteredConsumers.map((consumer) => (
                    <tr key={consumer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold">
                              {(consumer.fullname || 'C').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {consumer.fullname || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {consumer.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {consumer.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {consumer.location || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          consumer.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {consumer.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                            Login count: {consumer.login_count || 0}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            Last login: {formatDate(consumer.last_login)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewConsumerDetails(consumer)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteConsumer(consumer.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <UserCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No consumers found</p>
                        <p className="text-sm">Try adjusting your search or filter</p>
                        <button
                          onClick={fetchConsumers}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Refresh Consumers
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consumer Details Modal */}
        {selectedConsumer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Consumer Details</h3>
                  <button
                    onClick={() => setSelectedConsumer(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-green-600 font-bold">
                        {(selectedConsumer.fullname || 'C').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{selectedConsumer.fullname || 'Unknown'}</h4>
                      <p className="text-gray-600">{selectedConsumer.email || 'No email'}</p>
                      <div className="flex items-center mt-2">
                        <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Consumer ID: {selectedConsumer.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{selectedConsumer.location || 'Unknown'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedConsumer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedConsumer.status || 'active'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Login Count</p>
                      <p className="font-medium">{selectedConsumer.login_count || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium">{formatDateTime(selectedConsumer.last_login)}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Account Information</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">User Type:</span>
                        <span className="font-medium">Consumer</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Registration Date:</span>
                        <span className="font-medium">{selectedConsumer.created_at ? formatDate(selectedConsumer.created_at) : 'Not available'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleDeleteConsumer(selectedConsumer.id);
                        setSelectedConsumer(null);
                      }}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                      Delete Account
                    </button>
                    <button
                      onClick={() => setSelectedConsumer(null)}
                      className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumersManagement;