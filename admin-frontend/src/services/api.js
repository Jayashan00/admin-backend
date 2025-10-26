import axios from 'axios';
import { getToken } from './authService'; // Import getToken

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

// === Add this Interceptor ===
// Before sending any request, check if we have a token and add it to headers
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// === End Interceptor ===

export default api;