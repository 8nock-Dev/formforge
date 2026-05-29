import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use(cfg => {
  const tok = localStorage.getItem('ff_token');
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
