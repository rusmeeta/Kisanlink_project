import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.status === 200 && data.access_token) {
        // ✅ SAVE TOKEN
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("userType", data.user.user_type);
        localStorage.setItem("userName", data.user.fullname);
        localStorage.setItem("userId", data.user.id);

        // Redirect
        const userType = data.user.user_type;
        if (userType === "farmer") navigate("/farmer/dashboard");
        else if (userType === "consumer") navigate("/consumer/dashboard");
        else if (userType === "admin") navigate("/admin/dashboard");
        else navigate("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-green-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">Login to KisanLink</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Email Address</label>
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
            <label className="block text-sm font-semibold text-gray-700">Password</label>
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
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded"><p className="text-red-600">{error}</p></div>}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600">
            Don't have an account? <a href="/signup" className="text-green-700 font-semibold hover:underline">Sign Up Now</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;