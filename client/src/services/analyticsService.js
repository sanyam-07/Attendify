import api from "./api";

export const analyticsService = {
  /**
   * Fetch Student Analytics & Attendance Predictor
   * GET /api/analytics/student
   */
  getStudentAnalytics: async () => {
    try {
      const response = await api.get("/analytics/student");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch student analytics from API:", error.message);
      return null;
    }
  },

  /**
   * Fetch Teacher Analytics
   * GET /api/analytics/teacher
   */
  getTeacherAnalytics: async () => {
    try {
      const response = await api.get("/analytics/teacher");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch teacher analytics from API:", error.message);
      return null;
    }
  },

  /**
   * Fetch Admin System Analytics
   * GET /api/analytics/admin
   */
  getAdminAnalytics: async () => {
    try {
      const response = await api.get("/analytics/admin");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch admin analytics from API:", error.message);
      return null;
    }
  }
};

export default analyticsService;
