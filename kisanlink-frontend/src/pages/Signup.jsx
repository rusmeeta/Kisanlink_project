// src/pages/Signup.jsx - PRODUCTION WORKING VERSION
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    location: "",
    user_type: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // FIXED: Swapped localhost out for your live production Render server link
      const response = await fetch("https://kisanlink-project.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.fullname.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          location: formData.location,
          user_type: formData.user_type
        }),
      });

      const data = await response.json();

      // FIXED: Your backend route naturally returns message/user_id rather than data.success
      if (response.ok) {
        alert(
          "✅ Account Created Successfully!\n\n" +
          "Your account has been auto-activated for cloud deployment use.\n" +
          "You can log in immediately."
        );
        
        // Clear form fields
        setFormData({
          fullname: "",
          email: "",
          password: "",
          location: "",
          user_type: "",
        });
        
        // Navigate back to login
        navigate("/login");
        
      } else {
        // Handle specific schema error payloads from your auth.py file
        if (data.error && data.error.includes("not verified")) {
          const resend = window.confirm(
            "This email is registered but not verified. Resend verification email?"
          );
          if (resend) {
            // FIXED: Pointed resend block link safely to live production server endpoint
            const resendResponse = await fetch("https://kisanlink-project.onrender.com/resend-verification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
            });
            
            const resendData = await resendResponse.json();
            if (resendResponse.ok) {
              alert("✅ Verification email resent! Check your inbox.");
            } else {
              alert(resendData.error || "Failed to resend");
            }
          }
        } else {
          setError(data.error || "Signup failed");
        }
      }
    } catch (err) {
      setError("Network error connecting to production backend. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="Your full name (e.g. Priety Maharjan)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              placeholder="At least 8 characters"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select location</option>
              <option value="Naya Thimi">Naya Thimi</option>
              <option value="Gatthaghar">Gatthaghar</option>
              <option value="Kausaltar">Kausaltar</option>
              <option value="Lokanthali">Lokanthali</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">User Type</label>
            <select
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select type</option>
              <option value="farmer">Farmer</option>
              <option value="consumer">Consumer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 rounded font-medium ${
              isSubmitting 
                ? "bg-gray-400" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isSubmitting ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Account will be instantly initialized and auto-verified for easy production onboarding.
          </p>
        </div>

        <p className="mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-green-600 font-medium">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
