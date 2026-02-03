import React, { useState, useEffect } from 'react';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchComplaints = async () => {
    try {
      console.log("Fetching complaints...");
      const res = await fetch('http://localhost:5001/complaints/admin/all', {
        credentials: 'include'
      });
      const data = await res.json();
      console.log("Complaints response:", data);
      
      if (data.success) {
        setComplaints(data.complaints);
        console.log(`📊 Loaded ${data.complaints.length} complaints`);
      } else {
        console.error('Failed to fetch complaints:', data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      alert('Network error fetching complaints');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId, status) => {
    try {
      console.log(`Updating complaint ${complaintId} to ${status}`);
      const res = await fetch(`http://localhost:5001/complaints/admin/update/${complaintId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          admin_reply: replyText || 'Status updated'
        })
      });

      const data = await res.json();
      console.log("Update response:", data);
      
      if (data.success) {
        alert(data.message);
        setReplyingTo(null);
        setReplyText('');
        fetchComplaints(); // Refresh list
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Error updating complaint');
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const filteredComplaints = complaints.filter(complaint => 
    statusFilter === 'all' || complaint.status === statusFilter
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">User Complaints Management</h2>
            <p className="text-gray-600 mt-1">Review and resolve user complaints</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Complaints</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            
            <button
              onClick={fetchComplaints}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{complaints.length}</div>
            <div className="text-sm text-gray-600">Total Complaints</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{complaints.filter(c => c.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{complaints.filter(c => c.status === 'resolved').length}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{complaints.filter(c => c.status === 'dismissed').length}</div>
            <div className="text-sm text-gray-600">Dismissed</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading complaints from database...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No complaints found in database.</p>
            <p className="text-gray-400 text-sm mt-2">Try changing the filter or check if there are any complaints.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(complaint => (
              <div key={complaint.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                  {/* User Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        complaint.status === 'pending' ? 'bg-yellow-500' :
                        complaint.status === 'resolved' ? 'bg-green-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{complaint.user_name || 'Anonymous'}</h4>
                    <p className="text-sm text-gray-600">{complaint.user_email || 'No email'}</p>
                    <p className="text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{complaint.user_type}</span>
                      <span className="ml-2">{formatDate(complaint.created_at)}</span>
                    </p>
                    <p className="text-xs text-gray-400">ID: #{complaint.id}</p>
                  </div>

                  {/* Complaint Text */}
                  <div className="lg:col-span-2">
                    <p className="text-gray-700 whitespace-pre-wrap">{complaint.complaint_text}</p>
                    {complaint.admin_reply && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm font-medium text-green-800 mb-1">Admin Response:</p>
                        <p className="text-sm text-gray-700">{complaint.admin_reply}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {replyingTo === complaint.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your response to the user..."
                          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="4"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'dismissed')}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setReplyingTo(complaint.id)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          Reply & Update
                        </button>
                        {complaint.status !== 'resolved' && (
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                          >
                            Mark as Resolved
                          </button>
                        )}
                        {complaint.status !== 'dismissed' && (
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, 'dismissed')}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                          >
                            Dismiss Complaint
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaints;