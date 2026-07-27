import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Image as ImageIcon,
  Package,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Clock,
  Eye,
  AlertCircle
} from "lucide-react";

const ProductList = ({ isAdmin = false }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newPhoto, setNewPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = isAdmin 
        ? "https://kisanlink-project.onrender.com/admin/products"
        : "https://kisanlink-project.onrender.com/farmer/products";
      
      const res = await axios.get(url, { withCredentials: true });
      
      const fetchedProducts = res.data.products || [];
      console.log("Fetched products:", fetchedProducts);
      
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [isAdmin]);

  // Filter products based on search and status
  useEffect(() => {
    let filtered = products;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.farmer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (product.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(product => product.status === statusFilter);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter]);

  // Count products by status
  const countByStatus = (status) => {
    return products.filter(p => p.status === status).length;
  };

  const handleDelete = async (id) => {
    try {
      if (isAdmin) {
        await axios.delete(`https://kisanlink-project-1.onrender.com/admin/products/${id}/force-delete`, {
          withCredentials: true,
        });
      } else {
        await axios.delete(`https://kisanlink-project-1.onrender.com/farmer/delete-product/${id}`, {
          withCredentials: true,
        });
      }
      fetchProducts();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting product");
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
    setNewPhoto(null);
    setPreviewPhoto(
      product.photo_path
        ? `https://kisanlink-project-1.onrender.com/uploads/${product.photo_path}`
        : null
    );
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setNewPhoto(file);
    if (file) setPreviewPhoto(URL.createObjectURL(file));
    else
      setPreviewPhoto(
        editForm.photo_path
          ? `https://kisanlink-project-1.onrender.com/uploads/${editForm.photo_path}`
          : null
      );
  };

  // Farmer update
 // In your handleUpdate function:
const handleUpdate = async (id) => {
  if (!isAdmin) {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("item_name", editForm.item_name);
      formData.append("price", editForm.price);
      formData.append("location", editForm.location);
      formData.append("min_order_qty", editForm.min_order_qty);
      formData.append("available_stock", editForm.available_stock);

      if (newPhoto) formData.append("photo", newPhoto);

      const res = await axios.put(
        `https://kisanlink-project-1.onrender.com/farmer/update-product/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        alert(res.data.message || "Edit request submitted successfully!");
        setEditingId(null);
        setNewPhoto(null);
        setPreviewPhoto(null);
        fetchProducts();
      } else {
        alert(res.data.error || "Error submitting edit request");
      }
      
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      alert(err.response?.data?.error || "Error submitting edit request");
    } finally {
      setIsUpdating(false);
    }
  }
};

  // Status badge component
  const StatusBadge = ({ status, rejectionReason, hasPendingEdit = false }) => {
    const statusConfig = {
      approved: { 
        color: "bg-green-100 text-green-800", 
        icon: <CheckCircle size={14} className="mr-1" />, 
        label: "Approved" 
      },
      pending_approval: { 
        color: "bg-yellow-100 text-yellow-800", 
        icon: <Clock size={14} className="mr-1" />, 
        label: "Pending Approval" 
      },
      rejected: { 
        color: "bg-red-100 text-red-800", 
        icon: <XCircle size={14} className="mr-1" />, 
        label: "Rejected" 
      },
      pending: { 
        color: "bg-yellow-100 text-yellow-800", 
        icon: <Clock size={14} className="mr-1" />, 
        label: "Pending" 
      },
      edit_pending: {
        color: "bg-blue-100 text-blue-800",
        icon: <Edit2 size={14} className="mr-1" />,
        label: "Edit Pending"
      }
    };
    
    let config = statusConfig[status] || statusConfig.pending;
    
    // Override if there's a pending edit
    if (hasPendingEdit && status === 'approved') {
      config = statusConfig.edit_pending;
    }
    
    return (
      <div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {config.icon}
          <span>{config.label}</span>
        </span>
        {rejectionReason && status === 'rejected' && (
          <div className="mt-1 text-xs text-red-600 max-w-[150px] truncate" title={rejectionReason}>
            <AlertCircle size={10} className="inline mr-1" />
            {rejectionReason}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {isAdmin ? "All Products" : "Your Products"}
          </h2>
          <p className="text-gray-500 mt-1">
            {isAdmin ? "Manage all platform products" : "Manage your listed products here"}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
              <Package size={20} />
              <span className="font-semibold">Admin Mode</span>
            </div>
          )}
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
            <Package size={20} />
            <span className="font-semibold">{filteredProducts.length} Products</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-600">
              {countByStatus('approved')} Approved
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-gray-600">
              {countByStatus('pending_approval')} Pending
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-gray-600">
              {countByStatus('rejected')} Rejected
            </span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                <div className="flex items-center">
                  <ImageIcon size={16} className="mr-2" />
                  Photo
                </div>
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Product Name
              </th>
              {isAdmin && (
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                  Farmer
                </th>
              )}
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Price
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Location
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Stock
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center">
                  <div className="text-gray-400">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">
                      {searchTerm ? "Try different search terms" : "No products available"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    editingId === product.id ? "bg-blue-50" : ""
                  } ${
                    product.status === 'rejected' ? 'bg-red-50/30' : 
                    product.status === 'pending_approval' ? 'bg-yellow-50/30' : ''
                  }`}
                >
                  {/* Photo Column */}
                  <td className="py-4 px-6">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      {editingId === product.id ? (
                        previewPhoto ? (
                          <img 
                            src={previewPhoto} 
                            alt="preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={24} className="text-gray-400" />
                          </div>
                        )
                      ) : product.photo_path ? (
                        <img
                          src={`http://localhost:5001/uploads/${product.photo_path}`}
                          alt={product.item_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/64";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Editable/Display Fields */}
                  {editingId === product.id ? (
                    <>
                      <td className="py-4 px-6">
                        <input
                          name="item_name"
                          value={editForm.item_name || ""}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600">
                            {product.farmer_name || "Unknown"}
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            ₹
                          </span>
                          <input
                            name="price"
                            type="number"
                            step="0.01"
                            value={editForm.price || ""}
                            onChange={handleEditChange}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          name="location"
                          value={editForm.location || ""}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <input
                          name="available_stock"
                          type="number"
                          value={editForm.available_stock || ""}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge 
                          status={editForm.status || product.status} 
                          rejectionReason={editForm.rejection_reason || product.rejection_reason}
                          hasPendingEdit={product.has_pending_edit}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-3">
                          {!isAdmin && (
                            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <Edit2 size={16} className="mr-2" />
                              Change Photo
                              <input
                                type="file"
                                onChange={handlePhotoChange}
                                className="hidden"
                                accept="image/*"
                              />
                            </label>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdate(product.id)}
                              disabled={isUpdating}
                              className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <Save size={16} className="mr-2" />
                                  Save
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setNewPhoto(null);
                                setPreviewPhoto(null);
                              }}
                              className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800">{product.item_name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Min: {product.min_order_qty || 1} kg
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-700">{product.farmer_name || "Unknown"}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[150px]">
                            {product.farmer_email || ""}
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                          ₹{parseFloat(product.price || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-600">
                          <MapPin size={14} className="mr-1" />
                          {product.location || "Not specified"}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            (product.available_stock || 0) > 50 ? "bg-green-500" :
                            (product.available_stock || 0) > 10 ? "bg-yellow-500" : "bg-red-500"
                          }`}></div>
                          <span className="font-medium">{product.available_stock || 0}</span>
                          {(product.available_stock || 0) < 10 && (
                            <AlertTriangle size={12} className="ml-2 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge 
                          status={product.status} 
                          rejectionReason={product.rejection_reason}
                          hasPendingEdit={product.has_pending_edit}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          {!isAdmin && product.status === 'rejected' && (
                            <button
                              onClick={() => {
                                // Farmer can edit rejected product and resubmit
                                handleEditClick(product);
                              }}
                              className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors text-sm"
                            >
                              <Edit2 size={14} className="mr-1" />
                              Resubmit
                            </button>
                          )}
                          <button
                            onClick={() => handleEditClick(product)}
                            className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors text-sm"
                          >
                            <Edit2 size={14} className="mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(product.id)}
                            className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition-colors text-sm"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      {filteredProducts.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 gap-4">
          <div className="flex items-center space-x-4">
            <div>
              Showing <span className="font-semibold">{filteredProducts.length}</span> of{" "}
              <span className="font-semibold">{products.length}</span> products
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            )}
          </div>
          <div className="text-xs">
            {editingId && (
              <span className="text-blue-600 flex items-center">
                <Edit2 size={12} className="mr-1" />
                You are currently editing a product
              </span>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {isAdmin 
                ? "Are you sure you want to permanently delete this product? This action cannot be undone."
                : "Are you sure you want to delete this product? This action cannot be undone."
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                {isAdmin ? "Force Delete" : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;