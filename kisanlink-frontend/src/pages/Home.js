import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 font-sans text-gray-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
                  Kisanlink
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('products')}
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Products
              </button>
              <button 
                onClick={() => scrollToSection('join')}
                className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
              >
                Join
              </button>
              
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                >
                  Signup
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-emerald-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-amber-500/10"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center mb-4 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium">
            🗺️ Serving Madhyapur Thimi Municipality
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              Kisanlink
            </span>
            <br />
            <span className="text-gray-800 text-3xl md:text-4xl">
              Local Harvest, Direct to You
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto text-gray-600">
            Connecting farmers of Madhyapur Thimi with local consumers.
            Fresh, authentic produce straight from our fields to your table.
          </p>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 flex-col sm:flex-row">
            <Link
              to="/signup"
              className="group bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              Signup
            </Link>

            <Link
              to="/login"
              className="group border-2 border-emerald-600 text-emerald-700 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              Login
            </Link>
          </div>

          {/* Spacing */}
          <div className="mt-16"></div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              About <span className="text-emerald-600">Kisanlink</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Our Mission
              </h3>
              <p className="text-gray-600 mb-6">
                Kisanlink is a community-driven platform dedicated to bridging the gap between 
                local farmers and consumers in Madhyapur Thimi Municipality. We believe in 
                empowering farmers with direct market access while providing consumers with 
                fresh, authentic, and traceable agricultural products.
              </p>
              
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                What We Do
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-3">✓</span>
                  <span>Create direct connections between farmers and consumers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-3">✓</span>
                  <span>Provide farmers with fair pricing and market access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-3">✓</span>
                  <span>Offer consumers fresh, locally-sourced produce</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-3">✓</span>
                  <span>Support sustainable agricultural practices in our community</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-amber-50 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Why Choose Us?
              </h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">🌱</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">Community Focused</h4>
                    <p className="text-gray-600 text-sm">Dedicated exclusively to serving Madhyapur Thimi Municipality</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">💚</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">Transparent & Fair</h4>
                    <p className="text-gray-600 text-sm">Direct farmer-consumer connections eliminate middlemen</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">🚀</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">Easy to Use</h4>
                    <p className="text-gray-600 text-sm">Simple platform for both farmers and consumers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              How <span className="text-emerald-600">Kisanlink</span> Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A simple three-step process connecting our Thimi farmers with local consumers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative text-center p-8 rounded-2xl bg-gradient-to-b from-emerald-50 to-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-3xl">👨‍🌾</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Farmers List Produce</h3>
              <p className="text-gray-600">
                Local farmers in Thimi upload their fresh harvest with photos, prices, and availability
              </p>
            </div>

            <div className="relative text-center p-8 rounded-2xl bg-gradient-to-b from-amber-50 to-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-3xl">🛒</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Customers Browse & Order</h3>
              <p className="text-gray-600">
                Browse fresh produce from Thimi farms, place orders, and connect directly with farmers
              </p>
            </div>

            <div className="relative text-center p-8 rounded-2xl bg-gradient-to-b from-emerald-50 to-white shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Direct Delivery/Pickup</h3>
              <p className="text-gray-600">
                Fresh produce delivered to your doorstep or available for pickup in Thimi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Popular in <span className="text-emerald-600">Thimi</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fresh produce currently available from our local farms
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Fresh Vegetables", icon: "🥬", color: "bg-emerald-100" },
              { name: "Seasonal Fruits", icon: "🍎", color: "bg-red-100" },
              { name: "Organic Grains", icon: "🌾", color: "bg-amber-100" },
              { name: "Dairy Products", icon: "🥛", color: "bg-blue-100" },
            ].map((product, index) => (
              <div key={index} className={`${product.color} rounded-xl p-6 text-center hover:scale-105 transition-transform duration-300`}>
                <div className="text-4xl mb-3">{product.icon}</div>
                <h3 className="font-bold text-gray-900">{product.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Section */}
      <section id="join" className="py-16 px-4 bg-gradient-to-r from-emerald-600 to-amber-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join the Thimi Local Food Movement
          </h2>
          <p className="text-lg mb-8 text-emerald-100 max-w-2xl mx-auto">
            Whether you're a farmer looking to reach more customers or a consumer wanting fresh, 
            local produce - Kisanlink connects our community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-emerald-700 px-8 py-4 rounded-xl font-bold hover:bg-emerald-50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              Signup Now
            </Link>
            
            <Link
              to="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              Login to Account
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-emerald-100">
            Already have an account?{' '}
            <Link to="/login" className="font-bold underline hover:text-white">
              Login here
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <span className="text-lg font-semibold text-emerald-400">Madhyapur Thimi Municipality</span>
          </div>
          <p className="text-gray-400 text-sm">
            Connecting farmers and consumers within our community for fresher produce and stronger local economy
          </p>
          <p className="text-gray-500 text-xs mt-4">
            © {new Date().getFullYear()} Kisanlink. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;