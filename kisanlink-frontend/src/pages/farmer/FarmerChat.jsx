// src/pages/farmer/FarmerChat.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Clock } from "lucide-react";

const FarmerChat = () => {
  const { consumerId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [farmerId, setFarmerId] = useState(null); // Current farmer ID
  const messagesEndRef = useRef(null);

  // Fetch current farmer info
  const fetchFarmer = async () => {
    try {
      const res = await fetch("http://localhost:5001/farmer/me", {
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

  // Fetch messages with the specific consumer
  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://localhost:5001/messages/${consumerId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") setMessages(data.messages || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
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
      console.log("Send message response:", data); // Debug

      if (data.status === "success") {
        setMessages((prev) => [...prev, data.data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch farmer info once
  useEffect(() => {
    fetchFarmer();
  }, []);

  // Poll messages every 3 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [consumerId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow p-4 flex items-center">
        <button onClick={() => navigate("/farmer/messages")}>
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="ml-3 font-semibold">Chat with Customer {consumerId}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isFarmer = farmerId && m.sender_id === farmerId;

          return (
            <div key={m.id} className={`flex ${isFarmer ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                  isFarmer ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                <p>{m.message}</p>
                <div className="text-xs text-gray-200 mt-1 flex items-center justify-end">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 border-t flex space-x-2">
        <textarea
          className="flex-1 border rounded-lg p-2 resize-none"
          rows={2}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())
          }
        />
        <button onClick={sendMessage} className="bg-green-600 text-white px-4 py-2 rounded-lg">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FarmerChat;
