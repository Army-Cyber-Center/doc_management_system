import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ✅ ใช้ localStorage แทน sessionStorage (สอดคล้องกับไฟล์อื่น)
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ โหลด user จาก localStorage เมื่อ app เริ่มต้น
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
      }
    } else if (!storedToken) {
      // ถ้าไม่มี token ให้ลบข้อมูล user ด้วย
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = (newToken, userData = null) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // ✅ Redirect to login page after logout
    window.location.href = '/';
  };

  // ✅ เพิ่ม updateUser function
  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      login, 
      logout, 
      updateUser,
      loading,
      isAuthenticated: !!token && loading === false 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};