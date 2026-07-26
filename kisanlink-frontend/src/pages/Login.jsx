// Login.jsx - Updated with proper redirection
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setNeedsVerification(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setIsLoading(true);

    try {
      const response = await fetch("https://kisanlink-project.onrender.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.status === 200 && data.success) {
        // ✅ LOGIN SUCCESSFUL - Redirect based on user_type
        const userType = data.user_type;
        
        // Store user info in localStorage or context
        localStorage.setItem("userType", userType);
        localStorage.setItem("userName", data.fullname);
        localStorage.setItem("userId", data.user_id);
        
        // Redirect based on user type
        switch(userType) {
          case "farmer":
            navigate("/farmer/dashboard");
            break;
          case "consumer":
            navigate("/consumer/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          default:
            navigate("/dashboard");
        }
        
      } else if (response.status === 403 && data.needs_verification) {
        // ❌ Email not verified
        setNeedsVerification(true);
        setUserEmail(formData.email);
        setError("Please verify your email before logging in.");
        
      } else {
        // ❌ Other errors
        setError(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const emailToResend = userEmail || formData.email;
      if (!emailToResend) {
        setError("Please enter your email address");
        return;
      }

      const response = await fetch("https://kisanlink-project.onrender.com/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToResend })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        alert("✅ Verification email has been resent! Please check your inbox.");
        setError(""); // Clear error
      } else {
        setError(data.error || "Failed to resend verification email");
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError("Failed to resend verification email");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-green-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">
          Login to KisanLink
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-md font-semibold text-white transition ${
              isLoading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : "Login"}
          </button>
        </form>

        {/* Error Messages */}
        {error && (
          <div className={`mt-4 p-3 rounded-md ${needsVerification ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${needsVerification ? 'text-yellow-700' : 'text-red-600'}`}>
              {error}
            </p>
            
            {needsVerification && (
              <div className="mt-3">
                <button
                  onClick={handleResendVerification}
                  className="text-sm bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition"
                >
                  Resend Verification Email
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  Check your spam folder if you don't see the email.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Signup Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-green-700 font-semibold hover:underline"
            >
              Sign Up Now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;