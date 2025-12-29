import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // http://192.168.2.10:8000/api/v1
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor - ใส่ token
apiClient.interceptors.request.use(
  (config) => {
    // ✅ แก้ไข: ใช้ 'access_token' แทน 'token'
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      console.warn('⚠️ Token invalid or expired, redirecting to login...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // ✅ Redirect to login page
      window.location.href = '/';
    }
    // Handle 403 Forbidden
    else if (error.response?.status === 403) {
      console.warn('⚠️ Access forbidden');
    }
    return Promise.reject(error);
  }
);

export default apiClient;