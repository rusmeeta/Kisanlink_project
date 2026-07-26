// src/pages/farmer/ProductList.jsx – SIMPLIFIED WORKING VERSION
import React, { useEffect, useState } from "react";
import { API_BASE } from "../../api";

const getToken = () => localStorage.getItem('access_token');

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/farmer/products`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        setError("Failed to load products");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-green-700 mb-4">My Products</h1>
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No products added yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {p.photo_path && (
                <img 
                  src={`${API_BASE}/uploads/${p.photo_path}`} 
                  alt={p.item_name} 
                  className="w-full h-48 object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-bold">{p.item_name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xl font-semibold text-green-600">₹{p.price}/kg</span>
                  <span className="text-sm text-gray-500">{p.location}</span>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>Min: {p.min_order_qty}kg</span>
                  <span>Stock: {p.available_stock}kg</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;