// src/pages/farmer/Messages.jsx - UPDATED to match consumer interface
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, User, Clock, RefreshCw, Mail } from "lucide-react";

const FarmerMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5001";

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/farmer-conversations`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "success") {
        setConversations(data.conversations || []);
        // Calculate total unread messages
        const totalUnreadMessages = (data.conversations || []).reduce(
          (total, conv) => total + (conv.unread_count || 0), 0
        );
        setTotalUnread(totalUnreadMessages);
      } else {
        setError(data.message || "Failed to load conversations");
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to connect to server. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  // Mark messages as read when clicking a conversation
  const handleConversationClick = async (conversation) => {
    const { consumer_id, consumer_name, unread_count } = conversation;
    
    try {
      // Mark messages as read (farmer endpoint)
      await fetch(`${API_BASE_URL}/messages/mark-seen/${consumer_id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state immediately
      setConversations(prev => prev.map(conv => {
        if (conv.consumer_id === consumer_id) {
          return { ...conv, unread_count: 0 };
        }
        return conv;
      }));
      
      // Update total unread
      setTotalUnread(prev => Math.max(0, prev - (unread_count || 0)));
      
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
    
    // Navigate to chat
    navigate(`/farmer/chat/${consumer_id}`, {
      state: {
        consumer_name: consumer_name || `Customer ${consumer_id}`
      }
    });
  };

  // Listen for messages-marked-read events from Chat component
  useEffect(() => {
    const handleMessagesMarkedRead = (event) => {
      const { consumerId } = event.detail;
      
      // Update the specific conversation's unread_count
      setConversations(prev => prev.map(conv => {
        if (conv.consumer_id === consumerId) {
          return { ...conv, unread_count: 0 };
        }
        return conv;
      }));
      
      // Recalculate total unread
      setTotalUnread(prev => {
        // Use current conversations state to find the conversation
        const currentConvs = conversations;
        const conversation = currentConvs.find(c => c.consumer_id === consumerId);
        if (conversation) {
          return Math.max(0, prev - (conversation.unread_count || 0));
        }
        return prev;
      });
    };

    window.addEventListener('messages-marked-read', handleMessagesMarkedRead);
    
    return () => {
      window.removeEventListener('messages-marked-read', handleMessagesMarkedRead);
    };
  }, [conversations]);

  // Auto-refresh conversations every 10 seconds
  useEffect(() => {
    if (loading) return;
    
    const interval = setInterval(() => {
      fetchConversations();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [loading, fetchConversations]);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        fetchConversations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    
    try {
      let date;
      if (dateString.includes('Z')) {
        date = new Date(dateString);
      } else if (dateString.includes('+')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString + 'Z');
      }
      
      if (isNaN(date.getTime())) {
        return "Recently";
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      
      const isCurrentYear = date.getFullYear() === now.getFullYear();
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(isCurrentYear ? {} : { year: 'numeric' })
      });
    } catch (e) {
      console.error('Error parsing date:', dateString, e);
      return "Recently";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
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
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center relative">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Customer Messages</h1>
                  <p className="text-sm text-gray-500">
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} • 
                    <span className={`ml-2 ${totalUnread > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
                      {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
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
                <div className="mt-4 space-x-4">
                  <button 
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Retry
                  </button>
                  <Link 
                    to="/farmer/dashboard"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Go to Dashboard
                  </Link>
                </div>
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
              <p className="text-sm text-gray-500 mb-6">
                Customers can message you by clicking "Chat with Farmer" on your product listings
              </p>
              <Link 
                to="/farmer/dashboard"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-green-800">
                  Recent Conversations ({conversations.length})
                </h2>
                {totalUnread > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    {totalUnread} unread
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {conversations.map((conversation, index) => (
                <div
                  key={index}
                  onClick={() => handleConversationClick(conversation)}
                  className="block hover:bg-green-50 transition-colors duration-200 cursor-pointer"
                >
                  <div className="px-6 py-4 flex items-center">
                    <div className="flex-shrink-0 mr-4 relative">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      {conversation.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {conversation.consumer_name || `Customer ${conversation.consumer_id}`}
                          </h3>
                          {conversation.consumer_email && (
                            <p className="text-xs text-gray-500 mt-1">
                              {conversation.consumer_email}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatTimeAgo(conversation.last_msg_time)}
                          </span>
                          {conversation.unread_count > 0 && (
                            <span className="text-xs text-red-600 font-medium mt-1">
                              {conversation.unread_count} new
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate mt-2 flex-1">
                          {conversation.last_message || "No messages yet"}
                        </p>
                        {conversation.unread_count > 0 && (
                          <div className="ml-2">
                            <Mail className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
};

export default FarmerMessages;