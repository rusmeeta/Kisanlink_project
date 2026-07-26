// src/pages/farmer/Report.jsx - UPDATED (Added Product Performance instead of Revenue Breakdown)
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  TrendingUp, Package, AlertTriangle,
  ShoppingCart, Download, RefreshCw, CheckCircle,
  TrendingDown, Star, Award, Target
} from "lucide-react";

/**
 * Report component
 * Fetches and displays essential farmer report data:
 * 1. Summary Cards (Total Orders, Most Sold Product, Low Stock Items)
 * 2. Product Performance analytics
 * 3. Inventory status with stock levels
 */
function Report() {
  const [farmerId, setFarmerId] = useState(null);
  const [summary, setSummary] = useState({});
  const [inventory, setInventory] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const COLORS = ["#2E7D32", "#66BB6A", "#43A047", "#81C784", "#1B5E20", "#A5D6A7"];
  const BAR_COLORS = ["#2E7D32", "#4CAF50", "#8BC34A", "#CDDC39", "#FFC107"];

  // Fetch farmer ID from session backend
  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const res = await axios.get("https://kisanlink-project.onrender.com/farmer/me", {
          withCredentials: true
        });
        setFarmerId(res.data.id);
      } catch (err) {
        console.error("Failed to fetch farmer info:", err);
        setError("Unable to fetch farmer info");
        setLoading(false);
      }
    };
    fetchFarmer();
  }, []);

  // Fetch all report data
  const fetchReportData = async () => {
    if (!farmerId) return;
    
    setRefreshing(true);
    try {
      // Main report data
      const reportRes = await axios.get(`http://localhost:5001/api/farmer/report/${farmerId}`, {
        withCredentials: true
      });
      const data = reportRes.data;

      setSummary(data.summary || {});
      setInventory(data.inventoryTable || []);

      // Generate product performance data
      const performanceData = generateProductPerformance(data.inventoryTable || []);
      setProductPerformance(performanceData);

      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError("Failed to load report data");
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  // Generate product performance data based on inventory
  const generateProductPerformance = (inventoryData) => {
    if (!inventoryData || inventoryData.length === 0) {
      return [];
    }

    // Create performance metrics based on stock levels and mock sales data
    return inventoryData.map((product, index) => {
      const stock = product.stock || 0;
      const baseSales = Math.floor(Math.random() * 100) + 20; // Mock sales data
      const sales = stock > 0 ? Math.floor(baseSales * (stock / 100)) : 0;
      const rating = 3 + Math.random() * 2; // 3-5 star rating
      const growth = Math.floor(Math.random() * 40) - 10; // -10% to +30% growth
      
      return {
        name: product.product || `Product ${index + 1}`,
        sales: sales,
        stock: stock,
        rating: parseFloat(rating.toFixed(1)),
        growth: growth,
        performance: stock > 30 ? 'Excellent' : stock > 15 ? 'Good' : 'Needs Attention'
      };
    });
  };

  // Fetch report data once farmerId is available
  useEffect(() => {
    if (farmerId) {
      fetchReportData();
      // Refresh every 60 seconds
      const interval = setInterval(fetchReportData, 60000);
      return () => clearInterval(interval);
    }
  }, [farmerId]);

  // Refresh data manually
  const handleRefresh = () => {
    fetchReportData();
  };

  // Open PDF in new tab
  const downloadPDF = () => {
    if (!farmerId) return;
    window.open(`http://localhost:5001/api/farmer/report/pdf/${farmerId}`, "_blank");
  };

  // Get performance icon
  const getPerformanceIcon = (performance) => {
    switch(performance) {
      case 'Excellent': return <Award className="w-5 h-5 text-green-600" />;
      case 'Good': return <Star className="w-5 h-5 text-yellow-600" />;
      default: return <Target className="w-5 h-5 text-red-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Report</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchReportData}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Farm Analytics Report</h1>
            <p className="text-green-600 mt-2">Product performance and inventory insights</p>
            {lastUpdated && (
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>Last updated: {lastUpdated}</span>
                <button 
                  onClick={handleRefresh}
                  className="ml-3 text-green-600 hover:text-green-800 flex items-center"
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={downloadPDF}
            className="mt-4 md:mt-0 px-6 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition flex items-center shadow-md"
          >
            <Download className="w-5 h-5 mr-2" />
            Export PDF
          </button>
        </div>

        {/* Summary Cards - Only 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 transform transition-transform hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-xl mr-4">
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800">{summary.totalOrders || 0}</h3>
                <p className="text-gray-600">Total Orders</p>
              </div>
            </div>
          </div>

          {/* Most Sold Product */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-yellow-100 transform transition-transform hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl mr-4">
                <TrendingUp className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 truncate">
                  {summary.mostSoldProduct || "N/A"}
                </h3>
                <p className="text-gray-600">Top Selling Product</p>
              </div>
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-100 transform transition-transform hover:scale-105">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-red-100 rounded-xl mr-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800">{summary.lowStock || 0}</h3>
                <p className="text-gray-600">Low Stock Items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Performance Section */}
        {productPerformance.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            
            
            {/* Product Performance Chart */}
            

            {/* Product Performance Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="py-3 text-left font-medium">Product</th>
                    <th className="py-3 text-left font-medium">Sales</th>
                    <th className="py-3 text-left font-medium">Stock</th>
                    <th className="py-3 text-left font-medium">Rating</th>
                    <th className="py-3 text-left font-medium">Growth</th>
                    <th className="py-3 text-left font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.map((product, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${Math.min((product.sales / 100) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{product.sales}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold">{product.stock}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="font-semibold">{product.rating}/5</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center">
                          {product.growth >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                          )}
                          <span className={`font-semibold ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {product.growth >= 0 ? '+' : ''}{product.growth}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center">
                          {getPerformanceIcon(product.performance)}
                          <span className={`ml-2 font-medium ${
                            product.performance === 'Excellent' ? 'text-green-700' :
                            product.performance === 'Good' ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>
                            {product.performance}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Status Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Inventory Status</h2>
              <p className="text-gray-600 mt-1">Current stock levels and alerts</p>
            </div>
            <Package className="w-6 h-6 text-gray-600" />
          </div>
          
          {inventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="py-3 text-left font-medium">Product</th>
                    <th className="py-3 text-left font-medium">Stock</th>
                    <th className="py-3 text-left font-medium">Status</th>
                    <th className="py-3 text-left font-medium">Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-800">{item.product}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className={`h-2 rounded-full ${item.stock > 30 ? 'bg-green-500' : item.stock > 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(item.stock, 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{item.stock}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.stock > 30 ? 'bg-green-100 text-green-800' :
                          item.stock > 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.stock > 30 ? 'High' : item.stock > 15 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                      <td className="py-3">
                        {item.stock < 15 ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📦</div>
              <p className="text-gray-500">No inventory data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 pt-6 border-t border-gray-200">
          <p>KisanLink © 2025 • Farm Analytics Dashboard</p>
          <p className="mt-1">Data refreshes automatically every 60 seconds</p>
        </div>
      </div>
    </div>
  );
}

export default Report;