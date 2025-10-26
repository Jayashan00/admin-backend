import api from './api'; // Use our base axios instance

// POST /api/v1/auth/login
export const loginUser = (credentials) => {
  // credentials should be an object { username: '...', password: '...' }
  return api.post('/auth/login', credentials);
};

// POST /api/v1/auth/register
export const registerUser = (userData) => {
  // userData should be { username: '...', password: '...', role: '...' }
  return api.post('/auth/register', userData);
};

// Simple functions to handle token in localStorage
export const storeToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const getToken = () => {
  return localStorage.getItem('authToken');
};

export const removeToken = () => {
  localStorage.removeItem('authToken');
};