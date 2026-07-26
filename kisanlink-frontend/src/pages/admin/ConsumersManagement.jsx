import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
  Mail,
  MapPin,
  Calendar,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  Shield,
  Bell,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  MailWarning,
  Info
} from "lucide-react";

const ConsumersManagement = () => {
  const navigate = useNavigate();
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  // Deactivation modal states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [consumerToDeactivate, setConsumerToDeactivate] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [deactivationType, setDeactivationType] = useState("temporary");
  const [notificationMessage, setNotificationMessage] = useState("");

  // Reactivation modal states
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [consumerToReactivate, setConsumerToReactivate] = useState(null);
  const [reactivationReason, setReactivationReason] = useState("");

  useEffect(() => {
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn');
    
    if (!isAdminLoggedIn) {
      navigate("/admin");
      return;
    }
    
    checkAdminAuth();
    fetchConsumers();
  }, [navigate, statusFilter]);

  const checkAdminAuth = async () => {
    try {
      const res = await axios.get("https://kisanlink-project.onrender.com/admin/check-auth", {
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

  const fetchConsumers = async () => {
    try {
      console.log(`🔍 Fetching consumers from backend (status: ${statusFilter})...`);
      setLoading(true);
      setError("");
      
      const res = await axios.get(`http://localhost:5001/admin/consumers?status=${statusFilter}`, {
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

  const openDeactivateModal = (consumer) => {
    setConsumerToDeactivate(consumer);
    setDeactivationReason("");
    setDeactivationType("temporary");
    
    // Generate the notification message preview
    const message = generateDeactivationMessage(consumer.fullname, "", "temporary");
    setNotificationMessage(message);
    
    setShowDeactivateModal(true);
  };

  const openReactivateModal = (consumer) => {
    setConsumerToReactivate(consumer);
    setReactivationReason("");
    setShowReactivateModal(true);
  };

  // Generate the notification message that will be sent to consumer
  const generateDeactivationMessage = (consumerName, reason, type) => {
    const typeText = type === "permanent" ? "permanently" : "temporarily";
    const baseMessage = `Dear ${consumerName},\n\nYour account has been ${typeText} deactivated.`;
    
    if (reason) {
      return `${baseMessage}\n\nReason: ${reason}\n\nPlease contact support if you have any questions.\n\n- FarmLink Administration`;
    }
    
    return `${baseMessage}\n\nPlease contact support for more information.\n\n- FarmLink Administration`;
  };

  // Update notification message when reason or type changes
  useEffect(() => {
    if (consumerToDeactivate && deactivationReason) {
      const message = generateDeactivationMessage(
        consumerToDeactivate.fullname, 
        deactivationReason, 
        deactivationType
      );
      setNotificationMessage(message);
    }
  }, [deactivationReason, deactivationType, consumerToDeactivate]);

  const handleDeactivateConsumer = async () => {
    if (!consumerToDeactivate || !deactivationReason.trim()) {
      alert("Please provide a deactivation reason");
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [consumerToDeactivate.id]: 'deactivating' }));
      
      // Send the notification message along with other data
      const response = await axios.post(
        `http://localhost:5001/admin/users/${consumerToDeactivate.id}/deactivate`,
        { 
          reason: deactivationReason,
          deactivation_type: deactivationType,
          notification_message: notificationMessage // Include the message
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        fetchConsumers();
      } else {
        alert(`❌ ${response.data.error || 'Failed to deactivate consumer'}`);
      }
      
    } catch (err) {
      console.error("Error deactivating consumer:", err);
      
      if (err.response && err.response.data && err.response.data.error) {
        alert(`Failed to deactivate consumer: ${err.response.data.error}`);
      } else {
        alert("Failed to deactivate consumer. Please try again.");
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [consumerToDeactivate.id]: false }));
      setShowDeactivateModal(false);
      setConsumerToDeactivate(null);
      setDeactivationReason("");
      setDeactivationType("temporary");
      setNotificationMessage("");
    }
  };

  const handleReactivateConsumer = async () => {
    if (!consumerToReactivate) return;

    try {
      setActionLoading(prev => ({ ...prev, [consumerToReactivate.id]: 'reactivating' }));
      
      const response = await axios.post(
        `http://localhost:5001/admin/users/${consumerToReactivate.id}/reactivate`,
        { 
          reason: reactivationReason || "Admin manually reactivated account" 
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        fetchConsumers();
      } else {
        alert(`❌ ${response.data.error || 'Failed to reactivate consumer'}`);
      }
      
    } catch (err) {
      console.error("Error reactivating consumer:", err);
      
      if (err.response && err.response.data && err.response.data.error) {
        alert(`Failed to reactivate consumer: ${err.response.data.error}`);
      } else {
        alert("Failed to reactivate consumer. Please try again.");
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [consumerToReactivate.id]: false }));
      setShowReactivateModal(false);
      setConsumerToReactivate(null);
      setReactivationReason("");
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
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
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

  const getStatusDisplay = (consumer) => {
    if (consumer.is_active === false) {
      return {
        text: "Inactive",
        color: "bg-gray-100 text-gray-800",
        icon: <UserX className="h-3 w-3 mr-1" />
      };
    }
    return {
      text: "Active",
      color: "bg-green-100 text-green-800",
      icon: <UserCheck className="h-3 w-3 mr-1" />
    };
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
                className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
              >
                ← Back to Dashboard
              </button>
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Consumers Management</h1>
                  <p className="text-xs text-gray-500">Manage consumer accounts and status</p>
                </div>
              </div>
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
                {statusFilter === 'all' ? 'All' : statusFilter} consumers • Showing {filteredConsumers.length} of {consumers.length} consumers
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Data fetched from PostgreSQL database
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
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
                <option value="active">Active Consumers</option>
                <option value="inactive">Inactive Consumers</option>
                <option value="all">All Consumers</option>
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
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsumers.length > 0 ? (
                  filteredConsumers.map((consumer) => {
                    const status = getStatusDisplay(consumer);
                    const isActionLoading = actionLoading[consumer.id];
                    
                    return (
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
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center ${status.color}`}>
                            {status.icon}
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                            Login count: {consumer.login_count || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {formatDate(consumer.last_login)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewConsumerDetails(consumer)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                              title="View Details"
                              disabled={isActionLoading}
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            
                            {consumer.is_active ? (
                              <button
                                onClick={() => openDeactivateModal(consumer)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Deactivate Account"
                                disabled={isActionLoading}
                              >
                                {isActionLoading === 'deactivating' ? (
                                  <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <UserX className="h-5 w-5" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => openReactivateModal(consumer)}
                                className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                title="Reactivate Account"
                                disabled={isActionLoading}
                              >
                                {isActionLoading === 'reactivating' ? (
                                  <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <UserCheck className="h-5 w-5" />
                                )}
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
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Last login: {formatDate(selectedConsumer.last_login)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge with Deactivation Info */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div>
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedConsumer.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {selectedConsumer.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {!selectedConsumer.is_active && selectedConsumer.deactivation_type && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                          {selectedConsumer.deactivation_type === 'permanent' ? 'Permanent' : 'Temporary'}
                        </span>
                      )}
                    </div>
                    {selectedConsumer.deactivated_at && (
                      <div className="text-sm text-gray-500">
                        Deactivated on: {formatDate(selectedConsumer.deactivated_at)}
                      </div>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{selectedConsumer.location || 'Unknown'}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Activity</p>
                      <div className="flex items-center">
                        <ShoppingBag className="h-4 w-4 mr-2 text-gray-400" />
                        <p className="font-medium">Login count: {selectedConsumer.login_count || 0}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">User Type</p>
                      <p className="font-medium">Consumer</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Account Created</p>
                      <p className="font-medium">{formatDate(selectedConsumer.created_at)}</p>
                    </div>
                  </div>

                  {/* DEACTIVATION INFORMATION - ALWAYS SHOW FOR INACTIVE CONSUMERS */}
                  {!selectedConsumer.is_active && (
                    <div className="space-y-4">
                      {/* Deactivation Reason Section */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-bold text-red-800 mb-2">Account Deactivation Information</h5>
                            
                            {/* Show the reason admin typed when deactivating */}
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Deactivation Reason:</p>
                              <div className="bg-white p-3 rounded border border-red-100">
                                <p className="text-red-700 font-medium">
                                  {selectedConsumer.deactivation_reason || 
                                   selectedConsumer.reason || 
                                   'No specific reason provided'}
                                </p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                This is the reason you provided when deactivating this account
                              </p>
                            </div>
                            
                            {/* Deactivation Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-600">Deactivation Type:</p>
                                <p className="font-medium">
                                  {selectedConsumer.deactivation_type === 'permanent' ? 'Permanent Deactivation' : 
                                   selectedConsumer.deactivation_type === 'temporary' ? 'Temporary Deactivation' : 
                                   'Not specified'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Deactivated By:</p>
                                <p className="font-medium">{selectedConsumer.deactivated_by_name || 'System Admin'}</p>
                              </div>
                              {selectedConsumer.deactivated_at && (
                                <>
                                  <div>
                                    <p className="text-gray-600">Deactivation Date:</p>
                                    <p className="font-medium">{formatDate(selectedConsumer.deactivated_at)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Status Duration:</p>
                                    <p className="font-medium">
                                      {(() => {
                                        const deactivated = selectedConsumer.deactivated_at ? new Date(selectedConsumer.deactivated_at) : new Date();
                                        const now = new Date();
                                        const diffDays = Math.floor((now - deactivated) / (1000 * 60 * 60 * 24));
                                        return `${diffDays} days`;
                                      })()}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notification Message Sent to Consumer */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start mb-3">
                          <MessageSquare className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-blue-800">Notification Sent to Consumer</h5>
                            <p className="text-xs text-blue-600 mb-2">
                              This is the exact message that was sent to the consumer
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <MailWarning className="h-4 w-4 text-orange-500 mr-2" />
                              <span className="text-sm font-semibold text-gray-700">Message Content:</span>
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Sent via Email
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded border border-gray-200">
                            {selectedConsumer.notification_message || 
                             selectedConsumer.deactivation_message ||
                             `Dear ${selectedConsumer.fullname || 'Consumer'},

Your account has been deactivated.

${selectedConsumer.deactivation_reason ? `Reason: ${selectedConsumer.deactivation_reason}` : 'Please contact support for more information.'}

Please contact support if you have any questions.

- FarmLink Administration`}
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            <div className="flex justify-between">
                              <span>
                                {selectedConsumer.deactivated_at ? 
                                  `Sent on: ${formatDate(selectedConsumer.deactivated_at)}` : 
                                  'Message delivery date not recorded'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reactivation History (If any) */}
                  {selectedConsumer.reactivated_at && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <div>
                          <h5 className="font-bold text-green-800 mb-1">Account Reactivated</h5>
                          <p className="text-sm text-green-700">
                            Reactivated on: {formatDate(selectedConsumer.reactivated_at)}
                            {selectedConsumer.reactivation_reason && (
                              <span className="block mt-1 font-medium">Reactivation Reason: {selectedConsumer.reactivation_reason}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Account History Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-bold text-gray-900 mb-3">Account History</h5>
                    <div className="space-y-3 text-sm">
                      
                      <div className="flex justify-between items-center p-2 bg-white rounded border">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-gray-600">Last Login:</span>
                        </div>
                        <span className="font-medium">{formatDate(selectedConsumer.last_login)}</span>
                      </div>
                      {selectedConsumer.deactivated_at && (
                        <div className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100">
                          <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                            <span className="text-red-600">Deactivated:</span>
                          </div>
                          <span className="font-medium text-red-600">{formatDate(selectedConsumer.deactivated_at)}</span>
                        </div>
                      )}
                      {selectedConsumer.reactivated_at && (
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-100">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <span className="text-green-600">Reactivated:</span>
                          </div>
                          <span className="font-medium text-green-600">{formatDate(selectedConsumer.reactivated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    {selectedConsumer.is_active ? (
                      <button
                        onClick={() => {
                          setSelectedConsumer(null);
                          openDeactivateModal(selectedConsumer);
                        }}
                        className="flex-1 py-2 px-4 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
                      >
                        Deactivate Account
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          openReactivateModal(selectedConsumer);
                          setSelectedConsumer(null);
                        }}
                        className="flex-1 py-2 px-4 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
                      >
                        Reactivate Account
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedConsumer(null)}
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

        {/* Deactivation Modal */}
        {showDeactivateModal && consumerToDeactivate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Deactivate Consumer Account</h3>
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setConsumerToDeactivate(null);
                    setDeactivationReason("");
                    setNotificationMessage("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Consumer: <span className="font-medium">{consumerToDeactivate?.fullname}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Email: <span className="font-medium">{consumerToDeactivate?.email}</span>
                </p>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-700">
                      A notification will be sent to the consumer explaining the deactivation.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deactivation Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deactivationType"
                      value="temporary"
                      checked={deactivationType === "temporary"}
                      onChange={(e) => setDeactivationType(e.target.value)}
                      className="h-4 w-4 text-red-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Temporary (Can be reactivated)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="deactivationType"
                      value="permanent"
                      checked={deactivationType === "permanent"}
                      onChange={(e) => setDeactivationType(e.target.value)}
                      className="h-4 w-4 text-red-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Permanent</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deactivation Reason *
                </label>
                <textarea
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  placeholder="Explain why this consumer account is being deactivated..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be shown in the consumer's details and sent in the notification.
                </p>
              </div>

              {/* Notification Message Preview */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notification Preview
                  </label>
                  <span className="text-xs text-gray-500">Message that will be sent to consumer</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {notificationMessage || "Enter deactivation reason to see preview..."}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setConsumerToDeactivate(null);
                    setDeactivationReason("");
                    setNotificationMessage("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivateConsumer}
                  disabled={!deactivationReason.trim() || actionLoading[consumerToDeactivate?.id] === 'deactivating'}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading[consumerToDeactivate?.id] === 'deactivating' ? "Deactivating..." : "Deactivate Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reactivation Modal */}
        {showReactivateModal && consumerToReactivate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reactivate Consumer Account</h3>
                <button
                  onClick={() => {
                    setShowReactivateModal(false);
                    setConsumerToReactivate(null);
                    setReactivationReason("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Consumer: <span className="font-medium">{consumerToReactivate?.fullname}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Email: <span className="font-medium">{consumerToReactivate?.email}</span>
                </p>
                {consumerToReactivate?.deactivation_reason && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 mb-1">Previous Deactivation Reason:</p>
                        <p className="text-sm text-red-700">{consumerToReactivate.deactivation_reason}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-green-700">
                      A notification will be sent to the consumer about the reactivation.
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reactivation Reason (Optional)
                </label>
                <textarea
                  value={reactivationReason}
                  onChange={(e) => setReactivationReason(e.target.value)}
                  placeholder="Add a reason for reactivating this account..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be recorded in the account history.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReactivateModal(false);
                    setConsumerToReactivate(null);
                    setReactivationReason("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReactivateConsumer}
                  disabled={actionLoading[consumerToReactivate?.id] === 'reactivating'}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading[consumerToReactivate?.id] === 'reactivating' ? "Reactivating..." : "Reactivate Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumersManagement;