import api from './api'; // Base axios instance

// GET /api/v1/admin/users
export const getAllAdminUsers = () => {
  return api.get('/admin/users');
};

// GET /api/v1/admin/users/{id}
export const getAdminUserById = (id) => {
  return api.get(`/admin/users/${id}`);
};

// POST /api/v1/admin/users
export const createAdminUser = (userData) => {
  // userData = { username, password, role }
  return api.post('/admin/users', userData);
};

// PUT /api/v1/admin/users/{id}/role
export const updateAdminUserRole = (id, role) => {
  return api.put(`/admin/users/${id}/role`, { role });
};

// PUT /api/v1/admin/users/{id}/password (Optional, if implementing password reset)
export const updateAdminPassword = (id, password) => {
  return api.put(`/admin/users/${id}/password`, { password });
};

// DELETE /api/v1/admin/users/{id}
export const deleteAdminUser = (id) => {
  return api.delete(`/admin/users/${id}`);
};

// Helper function to get the current user's info (we need their role)
// Assumes JWT token payload might contain role, which we haven't added yet.
// For now, we'll decode it manually. In a real app, the backend might provide a /me endpoint.
import { jwtDecode } from 'jwt-decode'; // Install jwt-decode: npm install jwt-decode
import { getToken } from './authService';

export const getCurrentUserRole = () => {
    const token = getToken();
    if (!token) return null;
    try {
        const decodedToken = jwtDecode(token);
        // !! IMPORTANT !!: This assumes your backend's JwtUtil includes roles in the token claims.
        // If not, you need to either add roles to the JWT claims in JwtUtil.java
        // OR create a backend endpoint like /api/v1/auth/me that returns user details including role.
        // For now, let's *assume* the role might be under an 'authorities' claim (common with Spring Security)
        if (decodedToken.authorities && decodedToken.authorities.length > 0) {
             // Find the first role that starts with 'ROLE_'
             return decodedToken.authorities.find(auth => auth.startsWith('ROLE_'));
        }
         // Fallback if roles aren't in token (You'll need a backend /me endpoint)
        console.warn("User role not found in JWT token. Backend /me endpoint recommended.");
        // We'll hardcode SUPER_ADMIN for testing this feature FOR NOW
        // REMOVE THIS HARDCODING LATER
        return "ROLE_SUPER_ADMIN";
        // return null;
    } catch (error) {
        console.error("Failed to decode JWT:", error);
        return null;
    }
};