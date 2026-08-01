import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("attendify_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized / Token Expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid or expired auth session
      localStorage.removeItem("attendify_token");
      localStorage.removeItem("attendify_user");
      
      // Redirect to login page if not already there
      if (!window.location.hash.includes("/login") && !window.location.pathname.includes("/login")) {
        window.location.href = "#/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
