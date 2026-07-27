import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Upload, Package, MapPin, DollarSign, 
  ShoppingCart, Box, Camera, Plus, 
  Loader2, CheckCircle, X
} from "lucide-react";

/**
 * AddProduct component:
 * Compact non-scrolling form that fits within window height
 */
const AddProduct = () => {
  const [form, setForm] = useState({
    item_name: "",
    price: "",
    location: "",
    min_order_qty: 1,
    available_stock: 1,
  });

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [farmer, setFarmer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get farmer info from backend session
  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const res = await axios.get("https://kisanlink-project-1.onrender.com/farmer/me", {
          withCredentials: true,
        });
        setFarmer(res.data);
      } catch (err) {
        console.error("Error fetching farmer info:", err);
      }
    };
    fetchFarmer();
  }, []);

  // Preview image before upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size too large. Maximum size is 5MB." });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setMessage({ type: "error", text: "Please select an image file." });
        return;
      }
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
      setMessage("");
    }
  };

  // Update form state
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle number inputs
  const handleNumberChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value) || 1);
    setForm({ ...form, [e.target.name]: value });
  };

  // Submit new product to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!farmer) {
      setMessage({ type: "error", text: "Unable to fetch farmer info. Try reloading the page." });
      return;
    }
    if (!photo) {
      setMessage({ type: "error", text: "Please select a product image" });
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("item_name", form.item_name.trim());
      formData.append("price", parseFloat(form.price));
      formData.append("location", form.location.trim());
      formData.append("min_order_qty", form.min_order_qty);
      formData.append("available_stock", form.available_stock);
      formData.append("photo", photo);

      const res = await axios.post(
        "https://kisanlink-project-1.onrender.com/farmer/add-product",
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" }, 
          withCredentials: true 
        }
      );

      setMessage({
        type: "success",
        text: "✅ Product added successfully to marketplace!"
      });

      // Reset form
      setForm({
        item_name: "",
        price: "",
        location: "",
        min_order_qty:"" ,
        available_stock:"" ,
      });
      setPhoto(null);
      setPreview(null);

      // Clear success message after 5 seconds
      setTimeout(() => setMessage(""), 5000);

    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to add product. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setPhoto(null);
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-800">Add Product to Marketplace</h1>
              <p className="text-green-600">Quickly list your farm products for consumers</p>
            </div>
          </div>
          
          {farmer && (
            <div className="hidden md:flex items-center space-x-3 bg-white px-4 py-2 rounded-xl border border-green-200">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                {farmer.fullname?.charAt(0) || "F"}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800 text-sm">{farmer.fullname}</p>
                <p className="text-xs text-gray-600">Farmer</p>
              </div>
            </div>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === "success" 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <X className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`font-medium ${
                  message.type === "success" ? "text-green-700" : "text-red-700"
                }`}>
                  {message.text}
                </span>
              </div>
              <button onClick={() => setMessage("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Compact Form Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Product Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-green-600" />
                    Product Name *
                  </div>
                </label>
                <input
                  type="text"
                  name="item_name"
                  value={form.item_name}
                  onChange={handleChange}
                  required
                  placeholder="Tomatoes, Potatoes, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <div className="flex items-center ">
                    
                    Price (Rs/kg) *
                  </div>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-gray-500">Rs</div>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                    min="1"
                    step="0.01"
                    placeholder="120.00"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-green-600" />
                    Location *
                  </div>
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Gatthaghar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Min Order Qty */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2 text-green-600" />
                    Min Order (kg)
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="min_order_qty"
                    value={form.min_order_qty}
                    onChange={handleNumberChange}
                    min="1"
                    className="w-full px-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="absolute right-4 top-3.5 text-gray-500">kg</div>
                </div>
              </div>

              {/* Available Stock */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <div className="flex items-center">
                    <Box className="w-4 h-4 mr-2 text-green-600" />
                    Stock (kg)
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="available_stock"
                    value={form.available_stock}
                    onChange={handleNumberChange}
                    min="1"
                    className="w-full px-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <div className="absolute right-4 top-3.5 text-gray-500">kg</div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  <div className="flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-green-600" />
                    Product Image *
                  </div>
                </label>
                
                <div className="relative">
                  <div className={`border-2 ${photo ? 'border-green-300' : 'border-gray-300'} rounded-xl p-4`}>
                    {preview ? (
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-green-600 font-medium">Image selected</p>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="text-sm text-red-600 hover:text-red-800 mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="product-image" className="cursor-pointer">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="text-green-600 font-medium">Click to upload</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                        </div>
                      </label>
                    )}
                  </div>
                  <input
                    type="file"
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                    id="product-image"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || !photo}
                className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
                  isSubmitting || !photo
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submit
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Submit
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-3">
                * Required fields. Your product will be visible to consumers immediately.
              </p>
            </div>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          
          
          
          
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Product will be listed immediately. You can edit or remove it from the Product List page.</p>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;