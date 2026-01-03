  // src/pages/consumer/ChatWithFarmer.jsx
  import React, { useEffect, useState } from "react";
  import { useParams, useLocation, useNavigate } from "react-router-dom";
  import { API_BASE_URL } from "../../config";
  import ChatBox from "../../components/ChatBox";

  const ChatWithFarmer = () => {
    const { farmerId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [farmerDetails, setFarmerDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchFarmerDetails = async () => {
        if (!farmerId) {
          setLoading(false);
          return;
        }

        // Get farmer name from location state or fetch it
        const farmerNameFromState = location.state?.farmer_name;
        
        if (farmerNameFromState) {
          setFarmerDetails({
            farmer_id: farmerId,
            farmer_name: farmerNameFromState
          });
          setLoading(false);
          return;
        }

        // If not in state, try to fetch from API
        try {
          const response = await fetch(`${API_BASE_URL}/auth/users/${farmerId}`, {
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            setFarmerDetails({
              farmer_id: farmerId,
              farmer_name: data.fullname || data.name || `Farmer ${farmerId}`
            });
          } else {
            // Fallback
            setFarmerDetails({
              farmer_id: farmerId,
              farmer_name: `Farmer ${farmerId}`
            });
          }
        } catch (err) {
          console.error("Failed to fetch farmer details:", err);
          setFarmerDetails({
            farmer_id: farmerId,
            farmer_name: `Farmer ${farmerId}`
          });
        } finally {
          setLoading(false);
        }
      };

      fetchFarmerDetails();
    }, [farmerId, location.state]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-4 text-gray-600">Loading chat...</p>
          </div>
        </div>
      );
    }

    if (!farmerId || !farmerDetails) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Farmer Selected</h2>
            <p className="text-gray-600 mb-4">Please select a farmer to start chatting</p>
            <button
              onClick={() => navigate('/consumer/notifications')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Go Back to Notifications
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    Chat with {farmerDetails.farmer_name}
                  </h1>
                  <p className="text-sm text-gray-500">Farmer ID: {farmerId}</p>
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
          </div>
        </div>

        {/* Chat Area */}
        <div className="max-w-6xl mx-auto h-[calc(100vh-80px)]">
          <ChatBox 
            otherId={farmerId} 
            farmerName={farmerDetails.farmer_name} 
          />
        </div>
      </div>
    );
  };

  export default ChatWithFarmer;