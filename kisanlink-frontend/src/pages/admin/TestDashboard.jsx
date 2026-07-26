// src/pages/admin/TestDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const TestDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Simple Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">Admin Dashboard</h1>
            <Link 
              to="/" 
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Admin Dashboard Loaded Successfully!
          </h1>
          <p className="text-gray-600 text-lg">
            Admin login is working. You can now manage farmers and products.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Farmers</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-gray-500 text-sm">Total farmers registered</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Products</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-gray-500 text-sm">Total products listed</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">₹0</p>
            <p className="text-gray-500 text-sm">Total platform revenue</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/admin/farmers"
            className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
          >
            <h3 className="font-bold text-gray-900 text-lg mb-2">Manage Farmers</h3>
            <p className="text-gray-600">View, edit, and manage all registered farmers</p>
            <div className="mt-4 text-blue-600 font-medium">Go to Farmers →</div>
          </Link>
          
          <Link
            to="/admin/products"
            className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
          >
            <h3 className="font-bold text-gray-900 text-lg mb-2">Manage Products</h3>
            <p className="text-gray-600">View, approve, and manage all products</p>
            <div className="mt-4 text-blue-600 font-medium">Go to Products →</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;