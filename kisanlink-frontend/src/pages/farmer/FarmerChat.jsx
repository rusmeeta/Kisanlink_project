// src/pages/farmer/FarmerChat.jsx - FIXED HEADER VERSION
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Clock, User, MapPin, AlertCircle } from "lucide-react";

const FarmerChat = () => {
  const { consumerId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [farmerId, setFarmerId] = useState(null);
  const [consumerInfo, setConsumerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch current farmer info
  const fetchFarmer = async () => {
    try {
      const res = await fetch("https://kisanlink-project.onrender.com/farmer/me", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFarmerId(data.id);
      }
    } catch (err) {
      console.error("Error fetching farmer info:", err);
    }
  };

  // Fetch consumer details
  const fetchConsumerInfo = async () => {
    // Try method 1: Get from auth endpoint
    try {
      const res = await fetch(`http://localhost:5001/auth/users/${consumerId}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.status === "success") {
          setConsumerInfo(data);
          return;
        }
      }
    } catch (err) {
      console.error("Auth endpoint failed:", err);
    }
    
    // Try method 2: Get from messages endpoint
    try {
      const res = await fetch(`http://localhost:5001/messages/${consumerId}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.status === "success" && data.other_user) {
          setConsumerInfo(data.other_user);
          return;
        }
      }
    } catch (err) {
      console.error("Messages endpoint failed:", err);
    }
    
    // Fallback
    setConsumerInfo({
      id: consumerId,
      fullname: `Customer ${consumerId}`,
      location: "Unknown location",
      email: ""
    });
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://localhost:5001/messages/${consumerId}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.status === "success") {
          setMessages(data.messages || []);
        } else {
          setError(data.message || "Failed to load messages");
        }
      } else {
        setError(`HTTP Error: ${res.status}`);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`http://localhost:5001/messages/${consumerId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });
      
      const data = await res.json();

      if (data.status === "success") {
        setMessages((prev) => [...prev, data.message || data.data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial fetch
  useEffect(() => {
    fetchFarmer();
    fetchConsumerInfo();
    fetchMessages();
    
    // Poll messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [consumerId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* FIXED HEADER - Won't scroll */}
      <div className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate("/farmer/messages")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-gray-800 truncate">
                {consumerInfo?.fullname || `Customer ${consumerId}`}
              </h1>
              <div className="flex items-center text-sm text-gray-500 truncate">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{consumerInfo?.location || "Unknown location"}</span>
                {consumerInfo?.email && (
                  <span className="ml-2 truncate hidden sm:inline">• {consumerInfo.email}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-600 truncate">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* SCROLLABLE MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto" style={{ height: "calc(100vh - 160px)" }}>
        <div className="p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <User className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Start Conversation
              </h3>
              <p className="text-gray-600 max-w-sm">
                Chat with {consumerInfo?.fullname || `Customer ${consumerId}`} about their order
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Type your message below to get started
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isFarmer = farmerId && m.sender_id === farmerId;
              
              return (
                <div key={m.id} className={`flex ${isFarmer ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`px-4 py-3 rounded-lg max-w-xs lg:max-w-md ${
                      isFarmer 
                        ? "bg-green-600 text-white rounded-br-none" 
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{m.message}</p>
                    
                    <div className={`text-xs mt-2 flex items-center justify-end ${
                      isFarmer ? "text-green-100" : "text-gray-500"
                    }`}>
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(m.created_at+"Z").toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* FIXED INPUT AREA - Also won't scroll */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="p-4">
          <div className="flex space-x-3">
            <textarea
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows="2"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Type your message to ${consumerInfo?.fullname || `Customer ${consumerId}`}...`}
            />
            <button 
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="self-end bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default FarmerChat;