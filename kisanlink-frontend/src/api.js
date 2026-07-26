// src/api.js
import axios from 'axios';

export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Create an Axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Request interceptor: add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('adminLoggedIn');
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export const getToken = () => localStorage.getItem('access_token');