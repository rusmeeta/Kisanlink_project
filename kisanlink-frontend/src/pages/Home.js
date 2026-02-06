import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  ArrowRight, 
  Users, 
  Package, 
  Truck, 
  CheckCircle,
  Star,
  TrendingUp,
  Leaf,
  Clock,
  Award,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Heart,
  ShoppingBag,
  Calendar,
  ShieldCheck,
  Zap,
  Sun,
  Droplets,
  Sprout,
  Play,
  Pause,
  X,
  Lock,
  Mail
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    email: "",
    password: ""
  });
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    farmers: 0,
    products: 0,
    deliveries: 0,
    satisfaction: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  // Photo Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderInterval = useRef(null);
  const modalRef = useRef(null);

  // Local Madhyapur Thimi Photos (Bhaktapur, Nepal)
  // Using Nepali farming/agriculture images
  const slides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Thimi Local Farmers",
      description: "Farmers working in Madhyapur Thimi agricultural fields",
      overlay: "from-emerald-900/70 via-emerald-800/50 to-emerald-700/30",
      gradient: "from-emerald-600 to-emerald-700",
      location: "Thimi Agricultural Area"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Fresh Local Produce",
      description: "Vegetables grown in Thimi's fertile soil",
      overlay: "from-green-900/70 via-green-800/50 to-green-700/30",
      gradient: "from-green-600 to-green-700",
      location: "Thimi Farmlands"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Traditional Farming",
      description: "Sustainable farming practices in Madhyapur Thimi",
      overlay: "from-amber-900/70 via-amber-800/50 to-amber-700/30",
      gradient: "from-amber-600 to-amber-700",
      location: "Thimi Village"
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1621753104474-1c19cf6e7e3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Local Farmer Harvest",
      description: "Harvesting fresh vegetables in traditional ways",
      overlay: "from-teal-900/70 via-teal-800/50 to-teal-700/30",
      gradient: "from-teal-600 to-teal-700",
      location: "Thimi Fields"
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Fresh Crop Collection",
      description: "Gathering freshly harvested crops from the field",
      overlay: "from-blue-900/70 via-blue-800/50 to-blue-700/30",
      gradient: "from-blue-600 to-blue-700",
      location: "Thimi Farmlands"
    }
  ];

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
    setTimeout(() => {
      setStats({
        farmers: 156,
        products: 423,
        deliveries: 892,
        satisfaction: 96
      });
    }, 1000);
  }, []);

  // Auto slide functionality
  useEffect(() => {
    if (isAutoPlaying) {
      sliderInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 5000);
    } else {
      clearInterval(sliderInterval.current);
    }

    return () => clearInterval(sliderInterval.current);
  }, [isAutoPlaying, slides.length]);

  // Manual slide navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Fixed scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError("");
    setLoading(true);

    // SIMPLE DEMO LOGIN - This will always work
    // Use these credentials: admin@kisanlink.com / admin123
    if (adminCredentials.email === "admin@kisanlink.com" && adminCredentials.password === "admin123") {
      // Store authentication info
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminEmail", adminCredentials.email);
      localStorage.setItem("adminName", "Admin");
      
      // Close modal and reset form
      setShowAdminModal(false);
      setAdminCredentials({ email: "", password: "" });
      setLoading(false);
      
      // Navigate to admin dashboard
      navigate("/admin/dashboard");
      return;
    }

    // If not demo credentials, show error
    setAdminError("Invalid credentials. Use: admin@kisanlink.com / admin123");
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdminCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAdminModal(false);
        setAdminError("");
        setAdminCredentials({ email: "", password: "" });
      }
    };

    if (showAdminModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminModal]);

  // Add animation styles
  const styles = `
    @keyframes scale-in {
      0% {
        opacity: 0;
        transform: scale(0.95);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    .animate-scale-in {
      animation: scale-in 0.2s ease-out;
    }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 font-sans text-gray-900">
      <style>{styles}</style>
      
      {/* Navigation Bar */}
      <nav 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrollY > 50 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-emerald-100' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-white rounded-lg p-1.5">
                  <Leaf className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
                Kisanlink
              </span>
              <Sparkles className="h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {['home', 'how-it-works', 'features', 'join'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="relative text-gray-700 hover:text-emerald-600 font-medium transition-colors group capitalize"
                >
                  {item.replace('-', ' ')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300" />
                </button>
              ))}
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="relative flex items-center px-4 py-2 text-purple-700 hover:text-purple-800 font-medium transition-all group"
                >
                  <Shield size={16} className="mr-2 group-hover:scale-110 transition-transform" />
                  Admin
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                </button>

                <div className="h-6 w-px bg-gray-300" />
                
                <Link
                  to="/login"
                  className="px-4 py-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors hover:bg-emerald-50 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="relative px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden group"
                >
                  <span className="relative z-10">Signup</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </div>
            </div>

            <button className="md:hidden p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ========== PHOTO SLIDER SECTION ========== */}
      <section id="home" className="relative h-screen">
        {/* Slides Container */}
        <div className="absolute inset-0">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Background Image with Overlay */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${slide.image}')` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay}`} />
              </div>

              {/* Slide Content */}
              <div className="relative h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-2xl">
                    {/* Location Badge */}
                    <div className="inline-flex items-center mb-6 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                      <MapPin className="h-4 w-4 mr-2" />
                      🌾 Serving Madhyapur Thimi Municipality
                    </div>
                    
                    {/* Main Title */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                      <span className="bg-gradient-to-r from-white via-emerald-100 to-amber-100 bg-clip-text text-transparent">
                        Kisanlink
                      </span>
                      <br />
                      <span className="text-2xl md:text-4xl lg:text-5xl">
                        Fresh from <span className="text-emerald-300">Thimi Farms</span>
                      </span>
                    </h1>
                    
                    {/* Description */}
                    <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl">
                      Connecting local farmers with conscious consumers. Experience the difference of 
                      <span className="text-emerald-300 font-semibold"> farm-to-table</span> produce.
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link
                        to="/signup"
                        className="group relative bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center">
                          Start Shopping
                          <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>

                      <Link
                        to="/login"
                        className="group relative bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-all duration-300"
                      >
                        <span className="relative z-10 flex items-center">
                          Login to Account
                          <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                        </span>
                      </Link>
                    </div>
                    
                    {/* Location Info */}
                    <div className="mt-8 flex items-center text-white/80">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                        <span className="text-sm">{slide.location} • Bhaktapur, Nepal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Slider Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center space-x-4">
          {/* Play/Pause Button */}
          <button
            onClick={toggleAutoPlay}
            className="p-2 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors"
            aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          {/* Slide Indicators */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-emerald-400 w-8'
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Slide Counter */}
          <div className="text-white text-sm font-medium bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
            {currentSlide + 1} / {slides.length}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center mb-4 bg-gradient-to-r from-green-100 to-green-50 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
              <Sparkles className="h-4 w-4 mr-2" />
              Simple & Seamless
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              How It <span className="text-emerald-600">Works</span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Three simple steps from farm to your table
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: Users,
                title: "Farmers List Produce",
                description: "Local farmers upload fresh harvest with photos and prices",
                color: "emerald"
              },
              {
                step: "2",
                icon: ShoppingBag,
                title: "Browse & Order",
                description: "Select from fresh produce and place your order",
                color: "amber"
              },
              {
                step: "3",
                icon: Truck,
                title: "Fresh Delivery",
                description: "Get farm-fresh produce delivered to your doorstep",
                color: "green"
              }
            ].map((item) => (
              <div 
                key={item.step}
                className="relative group"
              >
                <div className={`bg-gradient-to-b from-white to-emerald-50 rounded-2xl p-8 shadow-xl border border-emerald-100 hover:border-emerald-300 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2`}>
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {item.step}
                  </div>
                  
                  <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="h-10 w-10 text-emerald-600" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 text-center">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center mb-4 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
              <Zap className="h-4 w-4 mr-2" />
              Why Choose Kisanlink
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Experience the <span className="text-emerald-600">Difference</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sprout className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">100% Organic</h3>
              <p className="text-gray-600 text-sm">Certified organic produce from Thimi farms</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">Same Day Delivery</h3>
              <p className="text-gray-600 text-sm">Fresh harvest delivered within hours</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-50 to-green-100 inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Quality Guaranteed</h3>
              <p className="text-gray-600 text-sm">Every product hand-picked and checked</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Fair Prices</h3>
              <p className="text-gray-600 text-sm">Direct from farmers, better prices</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="join" className="py-24 px-4 bg-gradient-to-r from-emerald-500 to-amber-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join the Food Revolution
          </h2>
          <p className="text-xl mb-8 text-emerald-100 max-w-2xl mx-auto">
            Be part of the movement that's changing how Thimi eats.
            Fresh, local, and direct from our farms.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-emerald-700 px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              Start Your Journey
            </Link>
            
            <Link
              to="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all duration-300"
            >
              Returning User?
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Leaf className="h-6 w-6 text-emerald-400 mr-2" />
                <span className="text-xl font-bold">Kisanlink</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting Thimi's farmers with conscious consumers.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-white transition-colors text-sm">Back to Top</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="text-gray-400 hover:text-white transition-colors text-sm">How It Works</button></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors text-sm">Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <p className="text-gray-400 text-sm">
                Madhyapur Thimi Municipality<br />
                Bhaktapur, Nepal
              </p>
              <p className="text-gray-400 text-sm mt-2">
                📞 +977 9841XXXXXX
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Kisanlink. Empowering local agriculture in Madhyapur Thimi.
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal - INLINE VERSION */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
          >
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminError("");
                  setAdminCredentials({ email: "", password: "" });
                }}
                className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Admin Login</h3>
                  <p className="text-white/80 text-sm">Access the admin dashboard</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={adminCredentials.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                      placeholder="admin@kisanlink.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={adminCredentials.password}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Demo credentials: admin@kisanlink.com / admin123
                  </p>
                </div>

                {/* Error Message */}
                {adminError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {adminError}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Sign in as Admin
                    </>
                  )}
                </button>

                {/* Admin Note */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    This area is restricted to authorized administrators only.
                    Unauthorized access attempts will be logged.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;