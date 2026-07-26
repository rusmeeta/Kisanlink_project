// src/components/SimpleChatBox.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../config";

const SimpleChatBox = ({ otherId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${otherId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setMessages(data.messages || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [otherId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await fetch(`${API_BASE_URL}/messages/${otherId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
        <p className="text-gray-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No messages yet</h3>
              <p className="text-gray-600 max-w-sm">
                Start your conversation
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender_id !== otherId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      isUser
                        ? "bg-green-600 text-white rounded-2xl rounded-br-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-none shadow-sm"
                    }`}
                  >
                    {/* Message Text */}
                    {msg.message && msg.message.trim() !== "" && (
                      <div className="p-3">
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                    )}

                    {/* Message Time */}
                    <div className={`px-3 pb-2 pt-1 ${isUser ? "text-green-100" : "text-gray-500"}`}>
                      <div className="flex justify-end items-center">
                        <span className="text-xs">{formatTime(msg.created_at)}</span>
                        {isUser && (
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:opacity-50"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows="1"
              disabled={sending}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatBox;
