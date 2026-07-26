// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setUser({
            id: data.user_id,
            name: data.fullname,
            email: data.email,
            type: data.user_type,
            location: data.location,
          });
          // Store in localStorage for quick access
          localStorage.setItem('user_id', data.user_id);
          localStorage.setItem('user_type', data.user_type);
          localStorage.setItem('user_name', data.fullname);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        const userData = {
          id: data.user_id,
          name: data.fullname,
          type: data.user_type,
        };
        setUser(userData);
        
        // Store in localStorage
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_type', data.user_type);
        localStorage.setItem('user_name', data.fullname);
        
        return { success: true, userType: data.user_type };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const logout = async () => {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
