  // src/pages/farmer/Messages.jsx - UPDATED
  import React, { useState, useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import { ArrowLeft, MessageCircle, User, Clock, RefreshCw } from 'lucide-react';

  const FarmerMessages = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Use the NEW farmer-conversations endpoint
        const res = await fetch('http://localhost:5001/messages/farmer-conversations', {
          credentials: 'include'
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            setConversations(data.conversations || []);
          } else {
            setError(data.message || 'Failed to load conversations');
          }
        } else {
          throw new Error('Failed to fetch conversations');
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('Failed to load conversations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const formatTimeAgo = (dateString) => {
      if (!dateString) return "Just now";
      const date = new Date(dateString+'Z');
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString();
    };

    useEffect(() => {
      fetchConversations();
    }, []);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  to="/farmer/dashboard"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">Customer Messages</h1>
                    <p className="text-sm text-gray-500">
                      {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchConversations}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
                <Link
                  to="/farmer/notifications"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>Notifications</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <div className="text-red-500 mr-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-red-800">Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <MessageCircle className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 mb-4">
                  When customers message you about your products, conversations will appear here.
                </p>
                <p className="text-sm text-gray-500">
                  Customers can message you by clicking "Chat with Farmer" on your product listings
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-3">
                <h2 className="text-sm font-medium text-gray-500">
                  Recent Conversations ({conversations.length})
                </h2>
              </div>
              {conversations.map((conversation, index) => (
                <Link
                  key={index}
                  to={`/farmer/chat/${conversation.consumer_id}`}
                  className="block border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.consumer_name || `Customer ${conversation.consumer_id}`}
                          </h3>
                          <span className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatTimeAgo(conversation.last_msg_time)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message || "No messages yet"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.consumer_email}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          
        </div>
      </div>
    );
  };

  export default FarmerMessages;