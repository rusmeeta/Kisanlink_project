import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Edit2, 
  Check, 
  X, 
  Eye, 
  Filter,
  Search,
  Clock,
  User,
  Package,
  DollarSign,
  MapPin,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Calendar,
  Mail,
  Hash
} from "lucide-react";
import axios from "axios";

const EditRequestsPage = () => {
  const navigate = useNavigate();
  const [editRequests, setEditRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    checkAdminAuth();
    loadEditRequests();
  }, [navigate]);

  const checkAdminAuth = async () => {
    try {
      const response = await axios.get("https://kisanlink-project.onrender.com/admin/check-auth", {
        withCredentials: true
      });

      if (!response.data.authenticated) {
        navigate("/admin");
      } else {
        setAdminName(response.data.name || "Admin");
      }
    } catch (err) {
      navigate("/admin");
    }
  };

  const loadEditRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://kisanlink-project.onrender.com/admin/edit-requests/pending", {
        withCredentials: true
      });
      
      if (response.data.success) {
        const allRequests = response.data.edit_requests || [];
        setEditRequests(allRequests);
        setFilteredRequests(allRequests);
      }
    } catch (err) {
      console.error("Error loading edit requests:", err);
      alert("Error loading edit requests");
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on search and status
  useEffect(() => {
    let filtered = editRequests;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.current_data.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.proposed_data.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.farmer_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    setFilteredRequests(filtered);
  }, [editRequests, searchTerm, statusFilter]);

  const handleApproveEditRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to approve this edit request?")) {
      return;
    }

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
        setSelectedRequest(null);
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

    if (!window.confirm("Are you sure you want to reject this edit request?")) {
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
        setSelectedRequest(null);
        setRejectReason("");
      }
    } catch (err) {
      console.error("Error rejecting edit request:", err);
      alert(err.response?.data?.error || "Error rejecting edit request");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
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

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'edit_pending': { 
        color: 'bg-yellow-100 text-yellow-800', 
        label: 'Pending', 
        icon: <Clock size={14} /> 
      },
      'edit_approved': { 
        color: 'bg-green-100 text-green-800', 
        label: 'Approved', 
        icon: <Check size={14} /> 
      },
      'edit_rejected': { 
        color: 'bg-red-100 text-red-800', 
        label: 'Rejected', 
        icon: <X size={14} /> 
      }
    };
    
    const config = statusConfig[status] || statusConfig.edit_pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon && <span className="mr-1">{config.icon}</span>}
        {config.label}
      </span>
    );
  };

  const CountStats = () => {
    const pendingCount = editRequests.filter(r => r.status === 'edit_pending').length;
    const approvedCount = editRequests.filter(r => r.status === 'edit_approved').length;
    const rejectedCount = editRequests.filter(r => r.status === 'edit_rejected').length;
    
    return (
      <div className="flex items-center space-x-6 mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          <span className="text-sm text-gray-600">{pendingCount} Pending</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-sm text-gray-600">{approvedCount} Approved</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span className="text-sm text-gray-600">{rejectedCount} Rejected</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading edit requests...</p>
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
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <Edit2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Requests Management</h1>
                <p className="text-xs text-gray-500">Manage product edit requests from farmers</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadEditRequests}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Requests</h2>
              <p className="text-gray-600">
                Review and approve product edit requests submitted by farmers
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                <Edit2 size={20} />
                <span className="font-semibold">{editRequests.length} Total Requests</span>
              </div>
            </div>
          </div>

          <CountStats />

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by product, farmer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                <option value="all">All Status</option>
                <option value="edit_pending">Pending</option>
                <option value="edit_approved">Approved</option>
                <option value="edit_rejected">Rejected</option>
              </select>
            </div>

            {/* Stats Summary */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-gray-600">
                Showing <span className="font-semibold">{filteredRequests.length}</span> of{" "}
                <span className="font-semibold">{editRequests.length}</span> requests
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Edit2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No edit requests found</h3>
              <p className="text-gray-600">
                {searchTerm ? "Try different search terms" : "All edit requests have been reviewed"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <div key={request.request_id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Request Info */}
                    <div className="flex-1">
                      <div className="flex items-start mb-3">
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {request.current_data.item_name}
                              <ChevronRight className="h-4 w-4 inline mx-2 text-gray-400" />
                              {request.proposed_data.item_name}
                            </h3>
                            <div className="ml-3">
                              <StatusBadge status={request.status} />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {request.farmer_name}
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {request.farmer_email}
                            </div>
                            <div className="flex items-center">
                              <Hash className="h-3 w-3 mr-1" />
                              Product ID: {request.product_id}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDateTime(request.requested_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Changes Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Price Change</div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="font-medium text-gray-900">₹{request.current_data.price}</span>
                            <ChevronRight className="h-3 w-3 mx-2 text-gray-400" />
                            <span className="font-medium text-green-600">₹{request.proposed_data.price}</span>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Location</div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="font-medium text-gray-900">{request.current_data.location}</span>
                            {request.current_data.location !== request.proposed_data.location && (
                              <>
                                <ChevronRight className="h-3 w-3 mx-2 text-gray-400" />
                                <span className="font-medium text-blue-600">{request.proposed_data.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Stock</div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="font-medium text-gray-900">{request.current_data.available_stock}</span>
                            {request.current_data.available_stock !== request.proposed_data.available_stock && (
                              <>
                                <ChevronRight className="h-3 w-3 mx-2 text-gray-400" />
                                <span className="font-medium text-orange-600">{request.proposed_data.available_stock}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Min Order</div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="font-medium text-gray-900">{request.current_data.min_order_qty}</span>
                            {request.current_data.min_order_qty !== request.proposed_data.min_order_qty && (
                              <>
                                <ChevronRight className="h-3 w-3 mx-2 text-gray-400" />
                                <span className="font-medium text-purple-600">{request.proposed_data.min_order_qty}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                      {request.status === 'edit_pending' && (
                        <>
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          <button
                            onClick={() => handleApproveEditRequest(request.request_id)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center justify-center"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setRejectReason("");
                            }}
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center justify-center"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </>
                      )}
                      {request.status !== 'edit_pending' && (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Edit2 className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Edit requests allow farmers to update their product information
                </p>
                <p className="text-xs text-blue-700">
                  Review each request carefully before approving or rejecting
                </p>
              </div>
            </div>
            <button
              onClick={loadEditRequests}
              className="flex items-center text-sm text-blue-700 hover:text-blue-900 font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh list
            </button>
          </div>
        </div>
      </div>

      {/* Edit Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Request Details</h3>
                  <p className="text-gray-600">Request ID: {selectedRequest.request_id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Status and Info */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center">
                    <StatusBadge status={selectedRequest.status} />
                    <span className="ml-4 text-gray-600">
                      Requested: {formatDateTime(selectedRequest.requested_at)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Farmer</div>
                  <div className="font-medium">{selectedRequest.farmer_name}</div>
                </div>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Current Data */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                    <AlertTriangle size={18} className="mr-2" />
                    Current Product Data
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Product Name:</span>
                      <p className="font-medium text-lg">{selectedRequest.current_data.item_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Price:</span>
                        <p className="font-medium flex items-center">
                          <DollarSign size={16} className="mr-1" />
                          ₹{selectedRequest.current_data.price}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Location:</span>
                        <p className="font-medium flex items-center">
                          <MapPin size={16} className="mr-1" />
                          {selectedRequest.current_data.location}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Available Stock:</span>
                        <p className="font-medium">{selectedRequest.current_data.available_stock} units</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Min Order Qty:</span>
                        <p className="font-medium">{selectedRequest.current_data.min_order_qty} units</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proposed Data */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                    <Edit2 size={18} className="mr-2" />
                    Proposed Changes
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Product Name:</span>
                      <p className="font-medium text-lg">{selectedRequest.proposed_data.item_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Price:</span>
                        <p className="font-medium flex items-center">
                          <DollarSign size={16} className="mr-1" />
                          ₹{selectedRequest.proposed_data.price}
                          {selectedRequest.current_data.price !== selectedRequest.proposed_data.price && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              selectedRequest.proposed_data.price > selectedRequest.current_data.price 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedRequest.proposed_data.price > selectedRequest.current_data.price ? '↑' : '↓'}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Location:</span>
                        <p className="font-medium flex items-center">
                          <MapPin size={16} className="mr-1" />
                          {selectedRequest.proposed_data.location}
                          {selectedRequest.current_data.location !== selectedRequest.proposed_data.location && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              Changed
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Available Stock:</span>
                        <p className="font-medium">
                          {selectedRequest.proposed_data.available_stock} units
                          {selectedRequest.current_data.available_stock !== selectedRequest.proposed_data.available_stock && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              selectedRequest.proposed_data.available_stock > selectedRequest.current_data.available_stock 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedRequest.proposed_data.available_stock > selectedRequest.current_data.available_stock ? '↑' : '↓'}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Min Order Qty:</span>
                        <p className="font-medium">
                          {selectedRequest.proposed_data.min_order_qty} units
                          {selectedRequest.current_data.min_order_qty !== selectedRequest.proposed_data.min_order_qty && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                              Changed
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Farmer Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Farmer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Full Name:</span>
                    <p className="font-medium flex items-center">
                      <User size={16} className="mr-2 text-gray-400" />
                      {selectedRequest.farmer_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-medium flex items-center">
                      <Mail size={16} className="mr-2 text-gray-400" />
                      {selectedRequest.farmer_email}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Farmer ID:</span>
                    <p className="font-medium flex items-center">
                      <Hash size={16} className="mr-2 text-gray-400" />
                      {selectedRequest.farmer_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rejection Section (only show for pending requests) */}
              {selectedRequest.status === 'edit_pending' && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Rejection Reason (if rejecting)</h4>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter detailed reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    rows="4"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                {selectedRequest.status === 'edit_pending' && (
                  <>
                    <button
                      onClick={() => handleRejectEditRequest(selectedRequest.request_id)}
                      disabled={!rejectReason.trim() || isProcessing}
                      className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={18} className="inline mr-2" />
                      Reject Changes
                    </button>
                    <button
                      onClick={() => handleApproveEditRequest(selectedRequest.request_id)}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditRequestsPage;