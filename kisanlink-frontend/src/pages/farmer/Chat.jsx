// src/pages/farmer/Chat.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";

const FarmerChat = () => {
  const { customerId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch conversation with this customer
    fetch(`http://localhost:5001/messages/${customerId}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setMessages(data.messages || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching messages:", err);
        setLoading(false);
      });

    // Fetch customer info
    fetch(`http://localhost:5001/users/${customerId}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setCustomerInfo(data);
      })
      .catch(console.error);
  }, [customerId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`http://localhost:5001/messages/${customerId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: newMessage.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          setMessages(prev => [...prev, data.data]);
          setNewMessage("");
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                {customerInfo?.fullname?.[0] || "C"}
              </div>
              <div>
                <h1 className="font-semibold text-gray-800">
                  {customerInfo?.fullname || `Customer ${customerId}`}
                </h1>
                {customerInfo?.location && (
                  <p className="text-sm text-gray-500">{customerInfo.location}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border min-h-[calc(100vh-200px)] flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Start a conversation</h3>
                <p className="text-gray-600 max-w-sm">
                  Send your first message to {customerInfo?.fullname || `Customer ${customerId}`}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isFarmer = msg.sender_id === parseInt(customerId);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isFarmer ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${isFarmer
                          ? "bg-gray-100 text-gray-800 rounded-bl-none"
                          : "bg-green-600 text-white rounded-br-none"
                        }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${isFarmer ? "text-gray-500" : "text-green-100"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <textarea
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Type your message to ${customerInfo?.fullname || `Customer ${customerId}`}...`}
                rows="2"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="self-end bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerChat;