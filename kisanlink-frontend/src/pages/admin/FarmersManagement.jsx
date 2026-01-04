import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Filter,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  MapPin,
  Calendar,
  RefreshCw,
  Package
} from "lucide-react";

const FarmersManagement = () => {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // Default to active
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check frontend admin login
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (!isAdminLoggedIn) {
      navigate("/");
      return;
    }
    
    checkAdminAuth();
    fetchFarmers();
  }, [navigate, statusFilter]); // Add statusFilter to dependencies

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

  const fetchFarmers = async () => {
    try {
      console.log(`🔍 Fetching farmers from backend (status: ${statusFilter})...`);
      setLoading(true);
      setError("");
      
      const res = await axios.get(`http://localhost:5001/admin/farmers?status=${statusFilter}`, {
        withCredentials: true,
        timeout: 10000
      });
      
      console.log("📦 Farmers API response:", res.data);
      
      if (res.data.success && Array.isArray(res.data.farmers)) {
        console.log(`✅ Found ${res.data.farmers.length} farmers from database`);
        setFarmers(res.data.farmers);
      } else {
        console.error("❌ Unexpected response format:", res.data);
        setError("Failed to load farmers: Invalid response format");
        setFarmers([]);
      }
      
    } catch (err) {
      console.error("❌ Error fetching farmers:", err);
      setError(`Failed to load farmers: ${err.message}`);
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateFarmer = async (farmerId, farmerName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${farmerName}? They will be hidden from the system but can be restored later.`)) return;

    try {
      // Use deactivate endpoint
      await axios.put(
        `http://localhost:5001/admin/users/${farmerId}/deactivate`,
        {},
        { withCredentials: true }
      );
      
      fetchFarmers();
      alert(`Farmer ${farmerName} has been deactivated!`);
      
    } catch (err) {
      console.error("Error deactivating farmer:", err);
      
      if (err.response && err.response.data && err.response.data.error) {
        alert(`Failed to deactivate farmer: ${err.response.data.error}`);
      } else {
        alert("Failed to deactivate farmer. Please try again.");
      }
    }
  };

  const handleReactivateFarmer = async (farmerId, farmerName) => {
    if (!window.confirm(`Are you sure you want to reactivate ${farmerName}?`)) return;

    try {
      // Use reactivate endpoint
      await axios.put(
        `http://localhost:5001/admin/users/${farmerId}/reactivate`,
        {},
        { withCredentials: true }
      );
      
      fetchFarmers();
      alert(`Farmer ${farmerName} has been reactivated!`);
      
    } catch (err) {
      console.error("Error reactivating farmer:", err);
      alert("Failed to reactivate farmer. Please try again.");
    }
  };

  // REMOVE THIS FUNCTION - We're not using hard delete anymore
  // const handleDeleteFarmer = async (farmerId) => { ... }

  const viewFarmerDetails = (farmer) => {
    setSelectedFarmer(farmer);
  };

  const filteredFarmers = farmers.filter((farmer) => {
    const matchesSearch = 
      (farmer.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (farmer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (farmer.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
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

  const getStatusDisplay = (farmer) => {
    if (farmer.is_active === false) {
      return {
        text: "Inactive",
        color: "bg-gray-100 text-gray-800"
      };
    }
    return {
      text: "Active",
      color: "bg-green-100 text-green-800"
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farmers from database...</p>
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
              <h1 className="text-xl font-bold text-gray-900">Farmers Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchFarmers}
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
              <h2 className="text-2xl font-bold text-gray-900">Manage Farmers</h2>
              <p className="text-gray-600">
                {statusFilter === 'all' ? 'All' : statusFilter} farmers • Showing {filteredFarmers.length} of {farmers.length} farmers
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
                <option value="active">Active Farmers</option>
                <option value="inactive">Inactive Farmers</option>
                <option value="all">All Farmers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Farmers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farmer
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
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFarmers.length > 0 ? (
                  filteredFarmers.map((farmer) => {
                    const status = getStatusDisplay(farmer);
                    return (
                      <tr key={farmer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {(farmer.fullname || 'F').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {farmer.fullname || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {farmer.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {farmer.email || 'No email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {farmer.location || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-gray-400" />
                            {farmer.product_count || 0} products
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {formatDate(farmer.last_login)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewFarmerDetails(farmer)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            
                            {farmer.is_active ? (
                              <button
                                onClick={() => handleDeactivateFarmer(farmer.id, farmer.fullname)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                title="Deactivate"
                              >
                                <UserX className="h-5 w-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivateFarmer(farmer.id, farmer.fullname)}
                                className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                                title="Reactivate"
                              >
                                <UserCheck className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <UserX className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No farmers found</p>
                        <p className="text-sm">Try adjusting your search or filter</p>
                        <button
                          onClick={fetchFarmers}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Refresh Farmers
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Farmer Details Modal */}
        {selectedFarmer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Farmer Details</h3>
                  <button
                    onClick={() => setSelectedFarmer(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-blue-600 font-bold">
                        {(selectedFarmer.fullname || 'F').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{selectedFarmer.fullname || 'Unknown'}</h4>
                      <p className="text-gray-600">{selectedFarmer.email || 'No email'}</p>
                      <div className="flex items-center mt-2">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Last login: {formatDate(selectedFarmer.last_login)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{selectedFarmer.location || 'Unknown'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedFarmer.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedFarmer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Products</p>
                      <p className="font-medium">{selectedFarmer.product_count || 0} listed</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Login Count</p>
                      <p className="font-medium">{selectedFarmer.login_count || 0}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    {selectedFarmer.is_active ? (
                      <button
                        onClick={() => {
                          handleDeactivateFarmer(selectedFarmer.id, selectedFarmer.fullname);
                          setSelectedFarmer(null);
                        }}
                        className="flex-1 py-2 px-4 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100"
                      >
                        Deactivate Account
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleReactivateFarmer(selectedFarmer.id, selectedFarmer.fullname);
                          setSelectedFarmer(null);
                        }}
                        className="flex-1 py-2 px-4 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100"
                      >
                        Reactivate Account
                      </button>
                    )}
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

export default FarmersManagement;