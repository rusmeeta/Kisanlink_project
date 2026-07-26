import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatBox from "../../components/chat/ChatBox";
import { getCurrentNepalTime } from "../../utils/timeUtils";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentNepalTime, setCurrentNepalTime] = useState("");

  useEffect(() => {
    // Get farmer data from location state
    if (location.state?.farmer_id) {
      setFarmerData({
        farmer_id: location.state.farmer_id,
        farmer_name: location.state.farmer_name || `Farmer ${location.state.farmer_id}`,
        order_id: location.state.order_id
      });
      setLoading(false);
    } else {
      // If no data, redirect back after 2 seconds
      const timer = setTimeout(() => {
        navigate('/consumer/notifications');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    // Update current Nepal time every second
    const updateTime = () => {
      const now = getCurrentNepalTime();
      setCurrentNepalTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kathmandu",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

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

  if (!farmerData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Farmer Selected</h2>
          <p className="text-gray-600 mb-4">Redirecting back to notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed at top */}
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
                  Chat with {farmerData.farmer_name}
                </h1>
                <p className="text-sm text-gray-500">
                  Farmer ID: {farmerData.farmer_id}
                  {farmerData.order_id && ` • Order: #${farmerData.order_id}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                Nepal Time: {currentNepalTime}
              </div>
              <button
                onClick={() => navigate('/consumer/notifications')}
                className="text-sm text-green-600 hover:text-green-800"
              >
                View Notifications
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area - Full height minus header */}
      <div className="max-w-6xl mx-auto h-[calc(100vh-80px)]">
        <ChatBox 
          otherId={farmerData.farmer_id} 
          farmerName={farmerData.farmer_name} 
        />
      </div>
    </div>
  );
};

export default Chat;