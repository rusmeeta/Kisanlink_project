// src/components/chat/WhatsAppStyleChat.jsx - UPDATED
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import ConsumerChat from "../../pages/consumer/ConsumerChat";

const WhatsAppStyleChat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    console.log("Location state in WhatsAppStyleChat:", location.state);
    
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/messages/conversations`, {
          credentials: "include",
        });
        const data = await res.json();
        console.log("Conversations API response:", data);
        
        if (data.status === "success") {
          const conversationsList = data.conversations || [];
          setConversations(conversationsList);
          
          // FIRST PRIORITY: Check if farmer was passed via location state from notifications
          if (location.state?.selectedFarmer) {
            const farmerFromState = location.state.selectedFarmer;
            console.log("Processing farmer from notification:", farmerFromState);
            
            // Try to find the farmer in conversations
            const existingConv = conversationsList.find(
              conv => conv.farmer_id == farmerFromState.farmer_id
            );
            
            if (existingConv) {
              console.log("Found farmer in existing conversations:", existingConv);
              setSelectedFarmer(existingConv);
            } else {
              console.log("Farmer not in conversations, using state data");
              // If not found, use the state data and add to conversations
              setSelectedFarmer(farmerFromState);
              
              // Add to conversations list for display
              setConversations(prev => [
                {
                  farmer_id: farmerFromState.farmer_id,
                  farmer_name: farmerFromState.farmer_name,
                  last_message: "No messages yet",
                  last_msg_time: null
                },
                ...prev
              ]);
            }
            
            // Clear the location state to prevent re-triggering
            setTimeout(() => {
              navigate(location.pathname, { replace: true, state: {} });
            }, 100);
            
          } 
          // SECOND PRIORITY: If no state farmer, check URL params
          else if (conversationsList.length > 0) {
            // Try to get farmer_id from URL params
            const urlParams = new URLSearchParams(window.location.search);
            const farmerIdFromUrl = urlParams.get('farmer_id');
            
            if (farmerIdFromUrl) {
              const farmerFromUrl = conversationsList.find(
                conv => conv.farmer_id == farmerIdFromUrl
              );
              if (farmerFromUrl) {
                setSelectedFarmer(farmerFromUrl);
              }
            } else {
              // Default to first conversation if none selected
              if (!selectedFarmer) {
                setSelectedFarmer(conversationsList[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };
    
    fetchConversations();
  }, [location.state, navigate]);

  // Also handle direct farmer selection when location state changes
  useEffect(() => {
    if (location.state?.selectedFarmer && !initialLoad) {
      console.log("Direct farmer selection from location state:", location.state.selectedFarmer);
      handleDirectFarmerSelect(location.state.selectedFarmer);
    }
  }, [location.state, initialLoad]);

  const handleDirectFarmerSelect = (farmerData) => {
    setSelectedFarmer(farmerData);
    
    // Add to conversations if not already there
    const exists = conversations.find(c => c.farmer_id == farmerData.farmer_id);
    if (!exists) {
      setConversations(prev => [
        {
          farmer_id: farmerData.farmer_id,
          farmer_name: farmerData.farmer_name,
          last_message: "No messages yet",
          last_msg_time: null
        },
        ...prev
      ]);
    }
    
    // Clear the state
    navigate(location.pathname, { replace: true, state: {} });
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && initialLoad) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Conversations List */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 bg-green-50 border-b border-green-100">
          <h2 className="text-xl font-bold text-green-800">Messages</h2>
          <p className="text-sm text-green-600 mt-1">Chat with farmers</p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">
                {searchTerm ? "No matching conversations" : "No conversations yet"}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-500 mt-1">
                  Start chatting with farmers to see conversations here
                </p>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.farmer_id}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedFarmer?.farmer_id == conv.farmer_id
                    ? "bg-green-50 border-l-4 border-l-green-500"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => {
                  console.log("Selecting farmer from list:", conv);
                  setSelectedFarmer(conv);
                }}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {conv.farmer_name?.charAt(0).toUpperCase() || 'F'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conv.farmer_name || `Farmer ${conv.farmer_id}`}
                      </p>
                      <p className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {conv.last_msg_time
                          ? new Date(conv.last_msg_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conv.last_message || "No messages yet"}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-400">
                        ID: {conv.farmer_id}
                      </span>
                      {selectedFarmer?.farmer_id == conv.farmer_id && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Back to Dashboard Link */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/consumer/dashboard')}
            className="flex items-center justify-center w-full text-sm text-green-600 hover:text-green-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFarmer ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">
                    {selectedFarmer.farmer_name?.charAt(0).toUpperCase() || 'F'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {selectedFarmer.farmer_name || `Farmer ${selectedFarmer.farmer_id}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Farmer ID: {selectedFarmer.farmer_id}
                    {selectedFarmer.unread_count > 0 && (
                      <span className="ml-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {selectedFarmer.unread_count} new
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/consumer/notifications')}
                className="text-sm text-green-600 hover:text-green-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
            
            {/* Chat Component */}
            <div className="flex-1">
              <ConsumerChat
                farmerId={selectedFarmer.farmer_id}
                farmerName={selectedFarmer.farmer_name}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Chat</h3>
            <p className="text-gray-600 text-center max-w-md mb-8">
              {conversations.length > 0 
                ? "Select a conversation from the left to start chatting with farmers."
                : "No conversations yet. Start by browsing farmers and initiating a chat."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600">💬</span>
                </div>
                <h4 className="font-medium text-gray-900">Discuss Products</h4>
                <p className="text-sm text-gray-500 mt-1">Ask about product quality and details</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600">💰</span>
                </div>
                <h4 className="font-medium text-gray-900">Negotiate Prices</h4>
                <p className="text-sm text-gray-500 mt-1">Discuss pricing and bulk order discounts</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600">📦</span>
                </div>
                <h4 className="font-medium text-gray-900">Arrange Delivery</h4>
                <p className="text-sm text-gray-500 mt-1">Plan delivery schedules and locations</p>
              </div>
            </div>
            
            {conversations.length === 0 && (
              <button
                onClick={() => navigate('/consumer/dashboard')}
                className="mt-8 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse Farmers
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppStyleChat;
