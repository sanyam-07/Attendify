// Authentication Service
// Integrates with backend Express REST API /api/auth endpoints.

import api from "./api";
import { dummyUsers } from "../data/dummyData";

export const authService = {
  /**
   * Login user via POST /api/auth/login
   * @param {string} username (email or name)
   * @param {string} password 
   * @param {string} role 'student' | 'teacher' | 'admin'
   */
  login: async (username, password, role) => {
    if (!username || !password) {
      throw new Error("Email/Username and password are required.");
    }

    try {
      const response = await api.post("/auth/login", {
        email: username,
        password
      });

      if (response.data && response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem("attendify_token", token);
        localStorage.setItem("attendify_user", JSON.stringify(user));

        return {
          success: true,
          token,
          user
        };
      }
      throw new Error(response.data?.message || "Login failed");
    } catch (error) {
      // Extract error message if provided by backend API
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }

      // Fallback mechanism if server is temporarily unreachable
      console.warn("Backend server connection failed. Using prototype fallback session:", error.message);
      const userProfile = dummyUsers[role] || {
        name: username.includes("@") ? username.split("@")[0] : username,
        email: username.includes("@") ? username : `${username}@attendify.com`,
        role: role || "student",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120"
      };

      const mockToken = `mock-token-${role}-${Date.now()}`;
      localStorage.setItem("attendify_token", mockToken);
      localStorage.setItem("attendify_user", JSON.stringify(userProfile));

      return {
        success: true,
        token: mockToken,
        user: userProfile
      };
    }
  },

  /**
   * Register user via POST /api/auth/register
   */
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      if (response.data && response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem("attendify_token", token);
        localStorage.setItem("attendify_user", JSON.stringify(user));
        return response.data;
      }
      throw new Error(response.data?.message || "Registration failed");
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Get current authenticated user profile via GET /api/auth/me
   */
  getMe: async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data && response.data.success) {
        localStorage.setItem("attendify_user", JSON.stringify(response.data.user));
        return response.data.user;
      }
    } catch (error) {
      console.warn("Failed to fetch /api/auth/me from server:", error.message);
    }
    return authService.getCurrentUser();
  },

  /**
   * Logout user session
   */
  logout: () => {
    localStorage.removeItem("attendify_token");
    localStorage.removeItem("attendify_user");
    return { success: true };
  },

  /**
   * Get cached user object from localStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem("attendify_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if token exists in localStorage
   */
  isAuthenticated: () => {
    return !!localStorage.getItem("attendify_token");
  }
};

export default authService;
