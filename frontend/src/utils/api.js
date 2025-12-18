const API_URL = process.env.REACT_APP_API_URL;

export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    // token หมดอายุ
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return res;
};
