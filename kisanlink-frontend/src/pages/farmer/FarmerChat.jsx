// src/pages/farmer/FarmerChat.jsx - FIXED
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, MapPin, Clock, MessageCircle } from 'lucide-react'; // Added MessageCircle

const FarmerChat = () => {
  const { consumerId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [consumerInfo, setConsumerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch conversation
  const fetchConversation = async () => {
    try {
      const res = await fetch(`http://localhost:5001/messages/${consumerId}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setMessages(data.messages || []);
        }
      }
    } catch (err) {
      console.error('Error fetching conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch consumer info
  const fetchConsumerInfo = async () => {
    try {
      const res = await fetch(`http://localhost:5001/users/${consumerId}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setConsumerInfo(data);
      }
    } catch (err) {
      console.error('Error fetching consumer info:', err);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const res = await fetch(`http://localhost:5001/messages/${consumerId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setMessages(prev => [...prev, data.data]);
          setNewMessage('');
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Set up polling for new messages
  useEffect(() => {
    fetchConversation();
    fetchConsumerInfo();
    
    const interval = setInterval(fetchConversation, 3000);
    return () => clearInterval(interval);
  }, [consumerId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate('/farmer/messages')}
              className="p-2 hover:bg-gray-100 rounded-full mr-3"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            {consumerInfo ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-800">{consumerInfo.fullname}</h1>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{consumerInfo.location || 'Unknown location'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-semibold text-gray-800">Customer {consumerId}</h1>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Messages */}
          <div className="h-[calc(100vh-280px)] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <MessageCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Conversation</h3>
                <p className="text-gray-600 max-w-sm mb-4">
                  Chat with {consumerInfo?.fullname || `Customer ${consumerId}`} about their order
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isFarmer = msg.sender_id !== parseInt(consumerId);
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isFarmer ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md rounded-lg px-4 py-3 ${isFarmer
                          ? 'bg-green-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <div className={`flex items-center justify-end mt-1 ${isFarmer ? 'text-green-100' : 'text-gray-500'}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        <span className="text-xs">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-3">
              <textarea
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Type your message to ${consumerInfo?.fullname || `Customer ${consumerId}`}...`}
                rows="2"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="self-end bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerChat;