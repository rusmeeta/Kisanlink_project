import React, { useState, useEffect } from 'react';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5001/complaints/admin/all', {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Fetched complaints:', data);
      
      if (data.success) {
        setComplaints(data.complaints || []);
        console.log(`📊 Loaded ${data.complaints?.length || 0} complaints`);
      } else {
        console.error('Failed to fetch complaints:', data.error);
        alert(data.error || 'Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      alert('Error loading complaints. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId, status) => {
    try {
      const res = await fetch(`http://localhost:5001/complaints/admin/update/${complaintId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          status: status,
          admin_reply: replyText || `Complaint marked as ${status}`
        })
      });

      const data = await res.json();
      console.log('Update response:', data);
      
      if (res.ok && data.success) {
        alert(data.message || `Complaint marked as ${status}`);
        setReplyingTo(null);
        setReplyText('');
        fetchComplaints(); // Refresh list
      } else {
        alert(data.error || 'Failed to update complaint');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Error updating complaint. Please try again.');
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints based on selected status
  const filteredComplaints = complaints.filter(complaint => {
    if (statusFilter === 'all') return true;
    return complaint.status === statusFilter;
  });

  // Count complaints by status
  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const reviewedCount = complaints.filter(c => c.status === 'reviewed').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const dismissedCount = complaints.filter(c => c.status === 'dismissed').length;

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Complaints</h2>
          <p className="text-gray-600">
            Total: {complaints.length} • Pending: {pendingCount}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Complaints</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="reviewed">Reviewed ({reviewedCount})</option>
              <option value="resolved">Resolved ({resolvedCount})</option>
              <option value="dismissed">Dismissed ({dismissedCount})</option>
            </select>
          </div>
          
          <button
            onClick={fetchComplaints}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <span>Refresh</span>
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          <div className="text-sm text-yellow-600 font-medium">Pending</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{reviewedCount}</div>
          <div className="text-sm text-blue-600 font-medium">Reviewed</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">{resolvedCount}</div>
          <div className="text-sm text-green-600 font-medium">Resolved</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-700">{dismissedCount}</div>
          <div className="text-sm text-red-600 font-medium">Dismissed</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaints from database...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No complaints found</h3>
          <p className="text-gray-500">
            {statusFilter === 'all' 
              ? "There are no complaints in the system." 
              : `No ${statusFilter} complaints found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 mb-4 px-4">
            <div className="text-sm font-medium text-gray-600">User Information</div>
            <div className="text-sm font-medium text-gray-600">Complaint Details</div>
            <div className="text-sm font-medium text-gray-600">Status & Date</div>
            <div className="text-sm font-medium text-gray-600">Actions</div>
          </div>

          {filteredComplaints.map(complaint => (
            <div key={complaint.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                {/* User Information */}
                <div>
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {complaint.user_name || 'Anonymous User'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {complaint.user_email || 'No email provided'}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">Type:</span>
                      <span className="font-medium capitalize">{complaint.user_type}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">ID:</span>
                      <span className="font-mono">#{complaint.id}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Submitted: {formatDate(complaint.created_at)}
                    </div>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="md:col-span-2">
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Complaint:</h5>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {complaint.complaint_text}
                      </p>
                    </div>
                  </div>
                  
                  {complaint.admin_reply && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <h6 className="font-medium text-green-800 mb-1">Admin Response:</h6>
                      <p className="text-sm text-gray-700">{complaint.admin_reply}</p>
                    </div>
                  )}

                  {replyingTo === complaint.id && (
                    <div className="mt-4">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response to the user..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        rows="3"
                      />
                    </div>
                  )}
                </div>

                {/* Status & Actions */}
                <div>
                  <div className="mb-4">
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                      {complaint.status?.toUpperCase() || 'PENDING'}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {formatDate(complaint.updated_at)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {replyingTo === complaint.id ? (
                      <div className="space-y-2">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'reviewed')}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            Mark as Reviewed
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Mark as Resolved
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'dismissed')}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Dismiss Complaint
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="w-full px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setReplyingTo(complaint.id)}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Reply & Update
                        </button>
                        
                        {complaint.status !== 'resolved' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Mark this complaint as resolved?')) {
                                updateComplaintStatus(complaint.id, 'resolved');
                              }
                            }}
                            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Quick Resolve
                          </button>
                        )}
                        
                        {complaint.status !== 'dismissed' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to dismiss this complaint?')) {
                                updateComplaintStatus(complaint.id, 'dismissed');
                              }
                            }}
                            className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Dismiss
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;