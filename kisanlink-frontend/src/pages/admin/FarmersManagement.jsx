// src/pages/admin/FarmersManagement.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar
} from "lucide-react";

const FarmersManagement = () => {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // In FarmersManagement.jsx and ProductsManagement.jsx, add:
useEffect(() => {
  // Check frontend admin login
  const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
  
  if (!isAdminLoggedIn) {
    navigate("/");
    return;
  }
  
  // Load data...
}, [navigate]);  

  useEffect(() => {
    checkAdminAuth();
    fetchFarmers();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const res = await axios.get("http://localhost:5001/admin/check-auth", {
        withCredentials: true
      });
      if (res.data.user_type !== "admin") {
        navigate("/login");
      }
    } catch (err) {
      console.error("Auth error:", err);
      navigate("/login");
    }
  };

  const fetchFarmers = async () => {
  try {
    console.log("🔍 Fetching farmers from backend...");
    
    const res = await axios.get("http://localhost:5001/admin/farmers", {
      withCredentials: true
    });
    
    console.log("📦 Farmers API response:", res.data);
    
    // Check for success flag and farmers array
    if (res.data.success && Array.isArray(res.data.farmers)) {
      console.log(`✅ Found ${res.data.farmers.length} farmers`);
      setFarmers(res.data.farmers);
    } else if (Array.isArray(res.data)) {
      console.log(`✅ Found ${res.data.length} farmers (direct array)`);
      setFarmers(res.data);
    } else {
      console.error("❌ Unexpected response format:", res.data);
      setFarmers([]);
    }
    
  } catch (err) {
    console.error("❌ Error fetching farmers:", err);
    if (err.response) {
      console.error("Response status:", err.response.status);
      console.error("Response data:", err.response.data);
    }
    setFarmers([]);
  } finally {
    setLoading(false);
  }
};

  const handleStatusChange = async (farmerId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this farmer?`)) return;

    try {
      await axios.put(
        `http://localhost:5001/admin/farmers/${farmerId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      fetchFarmers();
      alert(`Farmer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update farmer status");
    }
  };

  const handleDeleteFarmer = async (farmerId) => {
    if (!window.confirm("Are you sure you want to delete this farmer? This action cannot be undone.")) return;

    try {
      await axios.delete(
        `http://localhost:5001/admin/farmers/${farmerId}`,
        { withCredentials: true }
      );
      fetchFarmers();
      alert("Farmer deleted successfully!");
    } catch (err) {
      console.error("Error deleting farmer:", err);
      alert("Failed to delete farmer");
    }
  };

  const viewFarmerDetails = (farmer) => {
    setSelectedFarmer(farmer);
  };

  const filteredFarmers = farmers.filter((farmer) => {
    const matchesSearch = 
      farmer.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || farmer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Farmers Management</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Farmers</h2>
            <p className="text-gray-600">Total {farmers.length} farmers registered</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
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

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFarmers.length > 0 ? (
                  filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {farmer.fullname.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {farmer.fullname}
                            </div>
                            <div className="text-sm text-gray-500">
                              Joined: {new Date(farmer.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {farmer.email}
                          </div>
                          {farmer.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {farmer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {farmer.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          farmer.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : farmer.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {farmer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {farmer.product_count || 0} products
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewFarmerDetails(farmer)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(
                              farmer.id,
                              farmer.status === 'active' ? 'suspended' : 'active'
                            )}
                            className={`${
                              farmer.status === 'active'
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={farmer.status === 'active' ? 'Suspend' : 'Activate'}
                          >
                            {farmer.status === 'active' ? (
                              <UserX className="h-5 w-5" />
                            ) : (
                              <UserCheck className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteFarmer(farmer.id)}
                            className="text-red-600 hover:text-red-900"
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
                        <UserX className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No farmers found</p>
                        <p className="text-sm">Try adjusting your search or filter</p>
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
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-blue-600 font-bold">
                        {selectedFarmer.fullname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{selectedFarmer.fullname}</h4>
                      <p className="text-gray-600">{selectedFarmer.email}</p>
                      <div className="flex items-center mt-2">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Joined: {new Date(selectedFarmer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{selectedFarmer.location}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedFarmer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedFarmer.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleStatusChange(
                          selectedFarmer.id,
                          selectedFarmer.status === 'active' ? 'suspended' : 'active'
                        );
                        setSelectedFarmer(null);
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                        selectedFarmer.status === 'active'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {selectedFarmer.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteFarmer(selectedFarmer.id);
                        setSelectedFarmer(null);
                      }}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                      Delete Account
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

export default FarmersManagement;