// src/pages/consumer/Messages.jsx - UPDATED
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { Link } from "react-router-dom";
import { formatConversationTime } from '../../utils/timeUtils';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
          method: 'GET',
          credentials: 'include', // Important for cookies/session
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
        } else {
          setError(data.message || "Failed to load conversations");
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Failed to connect to server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Messages</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Retry
              </button>
              <Link
                to="/consumer/dashboard"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-green-800">Messages</h1>
          <p className="text-green-600 mt-2">Chat with farmers about their products</p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-green-400 text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No conversations yet</h3>
            <p className="text-gray-500 mb-6">Start chatting with farmers to see your conversations here</p>
            <Link
              to="/consumer/dashboard"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Farmers
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <h2 className="text-lg font-semibold text-green-800">Recent Conversations ({conversations.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {conversations.map(conv => (
                <Link
                  key={conv.farmer_id}
                  to={`/consumer/messages/${conv.farmer_id}`}
                  className="block hover:bg-green-50 transition-colors"
                >
                  <div className="px-6 py-4 flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">
                          {conv.farmer_name?.charAt(0) || 'F'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{conv.farmer_name || `Farmer ${conv.farmer_id}`}</h3>
                          <p className="text-sm text-gray-500">ID: {conv.farmer_id}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatConversationTime(conv.last_msg_time)}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-600 truncate">
                        {conv.last_message || "No messages yet"}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;