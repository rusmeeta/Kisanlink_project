// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Farmer pages
import FarmerDashboard from "./pages/farmer/Dashboard";
import AddProduct from "./pages/farmer/AddProduct";
import ProductList from "./pages/farmer/ProductList";
import Report from "./pages/farmer/Report";
import FarmerMessages from "./pages/farmer/Messages";
import FarmerNotifications from "./pages/farmer/Notifications";
import FarmerChat from "./pages/farmer/FarmerChat";
import FarmerOrdersPage from "./pages/farmer/Orders";

// Consumer pages
import ConsumerDashboard from "./pages/consumer/Dashboard";
import Cart from "./pages/consumer/Cart";
import Messages from "./pages/consumer/Messages";
import Notifications from "./pages/consumer/Notifications";
import ConsumerChat from "./pages/consumer/ConsumerChat";
import OrderStatus from "./pages/consumer/OrderStatus";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import FarmersManagement from "./pages/admin/FarmersManagement";
import ProductsManagement from "./pages/admin/ProductsManagement";
import ConsumersManagement from "./pages/admin/ConsumersManagement";
import TestDashboard from "./pages/admin/TestDashboard";
import PendingProducts from './pages/admin/PendingProducts';
import LowStockProducts from './pages/admin/LowStockProducts';
import AdminComplaints from "./pages/admin/Complaints"; // FIXED: Capital C
import EditRequestsPage from './pages/admin/EditRequestsPage';

import VerificationSuccess from "./pages/VerificationSuccess";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Farmer pages - Only farmers can access */}
        <Route path="/farmer/dashboard" element={
          <ProtectedRoute allowedUserType="farmer">
            <FarmerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/farmer/add-product" element={
          <ProtectedRoute allowedUserType="farmer">
            <AddProduct />
          </ProtectedRoute>
        } />
        <Route path="/farmer/products" element={
          <ProtectedRoute allowedUserType="farmer">
            <ProductList />
          </ProtectedRoute>
        } />
        <Route path="/farmer/report" element={
          <ProtectedRoute allowedUserType="farmer">
            <Report />
          </ProtectedRoute>
        } />
        <Route path="/farmer/messages" element={
          <ProtectedRoute allowedUserType="farmer">
            <FarmerMessages />
          </ProtectedRoute>
        } />
        <Route path="/farmer/notifications" element={
          <ProtectedRoute allowedUserType="farmer">
            <FarmerNotifications />
          </ProtectedRoute>
        } />
        <Route path="/farmer/chat/:consumerId" element={
          <ProtectedRoute allowedUserType="farmer">
            <FarmerChat />
          </ProtectedRoute>
        } />
        <Route path="/farmer/orders" element={
          <ProtectedRoute allowedUserType="farmer">
            <FarmerOrdersPage />
          </ProtectedRoute>
        } />

        {/* Consumer pages - Only consumers can access */}
        <Route path="/consumer/dashboard" element={
          <ProtectedRoute allowedUserType="consumer">
            <ConsumerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/consumer/cart" element={
          <ProtectedRoute allowedUserType="consumer">
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/consumer/messages" element={
          <ProtectedRoute allowedUserType="consumer">
            <Messages />
          </ProtectedRoute>
        } />
        <Route path="/consumer/notifications" element={
          <ProtectedRoute allowedUserType="consumer">
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/consumer/chat/:farmerId" element={
          <ProtectedRoute allowedUserType="consumer">
            <ConsumerChat />
          </ProtectedRoute>
        } />
        <Route path="/consumer/order-status" element={
          <ProtectedRoute allowedUserType="consumer">
            <OrderStatus />
          </ProtectedRoute>
        } />

        {/* Admin pages */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/farmers" element={<FarmersManagement />} />
        <Route path="/admin/products" element={<ProductsManagement />} />
        <Route path="/admin/consumers" element={<ConsumersManagement />} />
        <Route path="/admin/test-dashboard" element={<TestDashboard />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />
        <Route path="/admin/products/pending" element={<PendingProducts />} />
        <Route path="/admin/low-stock-products" element={<LowStockProducts />} />
        <Route path="/admin/edit-requests" element={<EditRequestsPage />} />

        {/* Other pages */}
        <Route path="/verification-success" element={<VerificationSuccess />} />

        {/* Catch-all */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
