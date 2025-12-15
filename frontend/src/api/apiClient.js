import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://10.3.0.249/:8000', // backend ของคุณ
  headers: {
    'Content-Type': 'application/json',
  },
});

// (optional) interceptor ไว้ใส่ token ภายหลัง
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
