export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";


const getToken = () => localStorage.getItem('access_token');

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = { ...options, headers };
  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response;
};export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

const getToken = () => localStorage.getItem('access_token');

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = { ...options, headers };
  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response;
};