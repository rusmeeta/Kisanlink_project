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
  PackageCheck,
  Box
} from "lucide-react";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newPhoto, setNewPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5001/farmer/products", {
        withCredentials: true,
      });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
      alert("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`http://localhost:5001/farmer/delete-product/${id}`, {
        withCredentials: true,
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Error deleting product");
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm(product);
    setNewPhoto(null);
    setPreviewPhoto(
      product.photo_path
        ? `http://localhost:5001/uploads/${product.photo_path}`
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
          ? `http://localhost:5001/uploads/${editForm.photo_path}`
          : null
      );
  };

  const handleUpdate = async (id) => {
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
        `http://localhost:5001/farmer/update-product/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      alert(res.data.message);
      setEditingId(null);
      setNewPhoto(null);
      setPreviewPhoto(null);
      fetchProducts();
    } catch (err) {
      console.error("Update error:", err.response?.data || err);
      alert(err.response?.data?.error || "Error updating product");
    } finally {
      setIsUpdating(false);
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Your Products</h2>
          <p className="text-gray-500 mt-1">Manage your listed products here</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
          <Package size={20} />
          <span className="font-semibold">{products.length} Products</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
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
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                <div className="flex items-center">
                  
                  Price
                </div>
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2" />
                  Location
                </div>
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                <div className="flex items-center">
                  <PackageCheck size={16} className="mr-2" />
                  Min Qty
                </div>
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                <div className="flex items-center">
                  <Box size={16} className="mr-2" />
                  Stock
                </div>
              </th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center">
                  <div className="text-gray-400">
                    <Package size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">Start by adding your first product</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr 
                  key={p.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    editingId === p.id ? "bg-blue-50" : ""
                  }`}
                >
                  {/* Photo Column */}
                  <td className="py-4 px-6">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      {editingId === p.id ? (
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
                      ) : p.photo_path ? (
                        <img
                          src={`http://localhost:5001/uploads/${p.photo_path}`}
                          alt={p.item_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Editable/Display Fields */}
                  {editingId === p.id ? (
                    <>
                      <td className="py-4 px-6">
                        <input
                          name="item_name"
                          value={editForm.item_name}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            
                          </span>
                          <input
                            name="price"
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={handleEditChange}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <input
                          name="location"
                          value={editForm.location}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <input
                          name="min_order_qty"
                          type="number"
                          value={editForm.min_order_qty}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <input
                          name="available_stock"
                          type="number"
                          value={editForm.available_stock}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-3">
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdate(p.id)}
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
                              onClick={() => setEditingId(null)}
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
                        <div className="font-medium text-gray-800">{p.item_name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                          
                          {parseFloat(p.price).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-gray-600">
                          <MapPin size={14} className="mr-1" />
                          {p.location}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-700 font-medium">{p.min_order_qty}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            p.available_stock > 50 ? "bg-green-500" :
                            p.available_stock > 10 ? "bg-yellow-500" : "bg-red-500"
                          }`}></div>
                          <span className="font-medium">{p.available_stock}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(p)}
                            className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="mr-2" />
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

      {products.length > 0 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <div>
            Showing <span className="font-semibold">{products.length}</span> products
          </div>
          <div className="text-xs">
            {editingId && (
              <span className="text-blue-600">
                ⓘ You are currently editing a product
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;