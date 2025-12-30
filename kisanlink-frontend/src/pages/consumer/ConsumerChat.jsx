// src/pages/consumer/ConsumerChat.jsx - UPDATED
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config";

const ConsumerChat = () => {
  const { farmerId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  // Fetch farmer details
  useEffect(() => {
    if (farmerId) {
      fetchFarmerDetails(farmerId);
      fetchMessages();
    }
  }, [farmerId]);

  // Auto-refresh messages
  useEffect(() => {
    if (!farmerId) return;
    
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [farmerId]);

  // FETCH FARMER DETAILS - IMPROVED
  const fetchFarmerDetails = async (id) => {
    console.log(`Fetching details for farmer ID: ${id}`);
    
    // Try multiple endpoints to get farmer name
    const endpoints = [
      `http://localhost:5001/consumer/farmer-details/${id}`,
      `http://localhost:5001/auth/users/${id}`,
      `http://localhost:5001/farmer/me?user_id=${id}`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Response from ${endpoint}:`, data);
          
          if (data.status === "success") {
            // Handle different response structures
            const farmerData = data.farmer || data;
            setFarmerDetails({
              fullname: farmerData.fullname || `Farmer ${id}`,
              email: farmerData.email || "",
              location: farmerData.location || "Unknown location",
              id: farmerData.id || id
            });
            return;
          }
        }
      } catch (err) {
        console.error(`Failed with endpoint ${endpoint}:`, err);
      }
    }
    
    // Last resort: Try to get name from messages
    try {
      const msgResponse = await fetch(`http://localhost:5001/messages/${id}`, {
        credentials: "include",
      });
      
      if (msgResponse.ok) {
        const msgData = await msgResponse.json();
        if (msgData.status === "success" && msgData.other_user) {
          setFarmerDetails({
            fullname: msgData.other_user.fullname || `Farmer ${id}`,
            email: msgData.other_user.email || "",
            location: msgData.other_user.location || "Unknown location",
            id: id
          });
          return;
        }
      }
    } catch (err) {
      console.error("Failed to get name from messages:", err);
    }
    
    // Ultimate fallback
    console.log("Using fallback for farmer name");
    setFarmerDetails({
      fullname: `Farmer ${id}`,
      email: "",
      location: "Unknown location",
      id: id
    });
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!farmerId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${farmerId}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Messages response:", data); // Debug
        
        if (data.status === "success") {
          setMessages(data.messages || []);
          
          // Also try to get farmer name from messages if we don't have it
          if (data.other_user && !farmerDetails) {
            setFarmerDetails({
              fullname: data.other_user.fullname || `Farmer ${farmerId}`,
              email: data.other_user.email || "",
              location: data.other_user.location || "Unknown location",
              id: farmerId
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return null;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("receiver_id", farmerId);
      formData.append("message", newMessage || "Sent a file");

      const response = await fetch(`${API_BASE_URL}/messages/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (err) {
      console.error("File upload failed:", err);
      alert("File upload failed. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    try {
      setSending(true);
      let fileData = null;

      // Upload file if selected
      if (selectedFile) {
        fileData = await handleFileUpload();
      }

      // Prepare message data
      const messageData = {
        message: newMessage.trim(),
      };

      if (fileData) {
        messageData.file_url = fileData.file_url;
        messageData.file_name = fileData.file_name;
        messageData.file_type = fileData.file_type;
      }

      // Send message
      const response = await fetch(`${API_BASE_URL}/messages/${farmerId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage("");
        setSelectedFile(null);
        setFilePreview(null);
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

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Maximum size is 10MB.");
      return;
    }

    processFile(file);
  };

  const processFile = (file) => {
    setSelectedFile(file);

    // Create preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview({
          url: e.target.result,
          name: file.name,
          type: file.type,
          size: formatFileSize(file.size),
        });
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview({
        url: null,
        name: file.name,
        type: file.type,
        size: formatFileSize(file.size),
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const getFileIcon = (fileType) => {
    if (!fileType) return "📎";
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
    if (fileType.includes("zip") || fileType.includes("compressed")) return "📦";
    return "📎";
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Display name - with fallback
  const displayName = farmerDetails?.fullname || `Farmer ${farmerId}`;
  const displayLocation = farmerDetails?.location || "Unknown location";

  if (!farmerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">No conversation selected</h3>
          <p className="text-gray-600">Please select a farmer to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed Header - Shows Farmer Name */}
      <div className="bg-green-600 text-white px-6 py-4 border-b border-green-700 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-white text-green-600 flex items-center justify-center font-bold mr-4 flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">{displayName}</h1>
            <div className="flex items-center mt-1 text-green-100">
              <span className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
              <span className="text-sm">Online • {displayLocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Area */}
      {filePreview && (
        <div className="border-b border-gray-200 bg-white p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {filePreview.url ? (
                <div className="relative">
                  <img
                    src={filePreview.url}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded mr-3 border border-gray-300"
                  />
                  <span className="absolute -top-1 -right-1 text-xs bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    📎
                  </span>
                </div>
              ) : (
                <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center mr-3 border border-green-200">
                  <span className="text-2xl">{getFileIcon(filePreview.type)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{filePreview.name}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span>{filePreview.type?.split("/")[1]?.toUpperCase() || "FILE"}</span>
                  <span className="mx-1">•</span>
                  <span>{filePreview.size}</span>
                </div>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="text-gray-400 hover:text-red-600 transition-colors p-1"
              title="Remove file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages Area - Scrolls */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-green-50 to-white">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No messages yet</h3>
            <p className="text-gray-600 max-w-sm mb-4">Start your conversation with {displayName}</p>
            <div className="text-sm text-gray-500 space-y-1 bg-white p-4 rounded-lg border border-gray-200">
              <p className="flex items-center">
                <span className="mr-2">📎</span>
                Click the paperclip icon to attach files
              </p>
              <p className="flex items-center">
                <span className="mr-2">⬇️</span>
                Drag & drop files anywhere to upload
              </p>
              <p className="flex items-center">
                <span className="mr-2">✅</span>
                Supported: Images, PDFs, Documents (max 10MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {messages.map((msg) => {
              const isUser = msg.sender_id !== farmerId;
              const hasFile = msg.file_url;

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
                    {hasFile && (
                      <div className="p-3 border-b border-gray-200">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{getFileIcon(msg.file_type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{msg.file_name || "File"}</p>
                            <p className="text-xs opacity-75">
                              {msg.file_type?.split("/")[1]?.toUpperCase() || "FILE"}
                            </p>
                          </div>
                          <a
                            href={`${API_BASE_URL}${msg.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                              isUser
                                ? "bg-green-700 text-white hover:bg-green-800"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            View
                          </a>
                        </div>
                      </div>
                    )}

                    {msg.message && msg.message.trim() !== "" && (
                      <div className="p-3">
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                    )}

                    <div className={`px-3 pb-2 pt-1 ${isUser ? "text-green-100" : "text-gray-500"}`}>
                      <div className="flex justify-end items-center">
                        <span className="text-xs">{formatTime(msg.created_at)}</span>
                        {isUser && (
                          <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
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
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Input Area at Bottom */}
      <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
        <div className="flex space-x-2">
          {/* File Upload Button */}
          <div className="relative">
            <button
              onClick={handleFileButtonClick}
              disabled={uploading || sending}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file (max 10MB)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              />
            </button>
            {selectedFile && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:opacity-50"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message to ${displayName}...`}
              rows="1"
              disabled={sending || uploading}
            />
            <div className="absolute right-2 bottom-2 text-xs text-gray-400">
              {sending ? "Sending..." : uploading ? "Uploading..." : "Enter to send"}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || sending || uploading}
            className="flex-shrink-0 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors transform hover:scale-105 active:scale-95"
          >
            {sending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : uploading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              "Send"
            )}
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Drag & drop files anywhere or click the paperclip icon</span>
          </div>
          <span>Max 10MB</span>
        </div>
      </div>
    </div>
  );
};

export default ConsumerChat;