// src/pages/farmer/Dashboard.jsx
import React, { useEffect, useState } from "react";
import AddProduct from "./AddProduct";
import ProductList from "./ProductList";
import Report from "./Report";
import { DollarSign, Bell, MessageCircle, Edit3, Mail, MapPin } from "lucide-react";

const FarmerDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const res = await fetch("http://localhost:5001/farmer/me", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Error fetching farmer info:", err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://localhost:5001/notifications", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    const fetchMessages = async () => {
      try {
        const res = await fetch("http://localhost:5001/messages", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchFarmer();
    fetchNotifications();
    fetchMessages();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5001/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    } catch (err) {
      window.location.href = "/login";
    }
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "addProduct", label: "Add Product" },
    { id: "productList", label: "Product List" },
    { id: "reports", label: "Reports" },
    { id: "notifications", label: `Notifications (${notifications.length})` },
    { id: "messages", label: `Messages (${messages.length})` },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 text-center border-b">
          <div className="h-20 w-20 mx-auto rounded-full bg-green-600 flex items-center justify-center text-white text-3xl font-bold">
            {user ? user.fullname[0] : "F"}
          </div>
          <h2 className="mt-3 font-bold text-lg text-gray-800">{user?.fullname || "Farmer"}</h2>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab.id
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-green-100"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Bar: Welcome left, Logout + Icons right */}
        <div className="flex justify-between items-center mb-6">
          {/* Welcome */}
          <h1 className="text-3xl font-bold text-green-700">
            Welcome, {user?.fullname}!
          </h1>

          {/* Right Side: Icons + Logout */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              className="relative bg-white p-2 rounded-full hover:bg-gray-100 transition"
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="w-6 h-6 text-green-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Messages */}
            <button
              className="relative bg-white p-2 rounded-full hover:bg-gray-100 transition"
              onClick={() => setActiveTab("messages")}
            >
              <MessageCircle className="w-6 h-6 text-green-600" />
              {messages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {messages.length}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && user && (
          <>
            {/* Farmer Info Card */}
            <div className="bg-white p-6 rounded-2xl shadow mb-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user.fullname[0]}
                </div>
                <div className="flex flex-col space-y-1">
                  <h2 className="text-xl font-bold text-gray-800">{user.fullname}</h2>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-1 text-green-600" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-1 text-green-600" />
                    <span>{user.location}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => window.alert("Edit your information here!")}
                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition mt-4 md:mt-0"
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
            </div>

            {/* Sales Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {["Today", "Last 7 Days", "Last 30 Days"].map((label, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition text-center"
                >
                  <DollarSign className="mx-auto text-green-600 mb-2" />
                  <h3 className="text-lg font-semibold text-gray-700">{label} Sales</h3>
                  <p className="text-2xl font-bold text-green-700 mt-1">Rs 0</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "addProduct" && <AddProduct />}
        {activeTab === "productList" && <ProductList />}
        {activeTab === "reports" && user && <Report farmerId={user.id} />}

        {activeTab === "notifications" && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Notifications</h2>
            {notifications.length === 0 ? (
              <p>No new notifications.</p>
            ) : (
              notifications.map((n, idx) => (
                <div key={idx} className="border-b py-2">{n.message}</div>
              ))
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Messages</h2>
            {messages.length === 0 ? (
              <p>No new messages.</p>
            ) : (
              messages.map((m, idx) => (
                <div key={idx} className="border-b py-2">
                  <strong>{m.sender_name}:</strong> {m.message}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FarmerDashboard;