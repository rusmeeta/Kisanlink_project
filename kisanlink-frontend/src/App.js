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

// Consumer pages
import ConsumerDashboard from "./pages/consumer/Dashboard";
import Cart from "./pages/consumer/Cart";
import Messages from "./pages/consumer/Messages";
import Notifications from "./pages/consumer/Notifications";
import ConsumerChat from "./pages/consumer/ConsumerChat";

// Import ProtectedRoute if you created it
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
        <Route path="/consumer/messages/:farmerId" element={
          <ProtectedRoute allowedUserType="consumer">
            <ConsumerChat />
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;