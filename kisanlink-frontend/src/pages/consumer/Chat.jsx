import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const BACKEND_URL = "http://localhost:5001";

const Chat = () => {
  const { farmer_id } = useParams();
  const [searchParams] = useSearchParams();
  const order_id = searchParams.get("order_id");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/chat/${farmer_id}?order_id=${order_id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") setMessages(data.messages);
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [farmer_id, order_id]);

  const sendMessage = async () => {
    if (!input) return;
    try {
      await fetch(`${BACKEND_URL}/chat/${farmer_id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, order_id }),
      });
      setInput("");
      fetchMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Chat with Farmer {farmer_id}</h2>
      <div className="space-y-2 mb-4 max-h-[60vh] overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${m.from === "consumer" ? "bg-blue-100 text-right" : "bg-gray-100 text-left"}`}
          >
            {m.message}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 p-2 border rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-blue-500 text-white p-2 rounded" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
