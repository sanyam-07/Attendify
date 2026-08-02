import api from "./api";

export const curriculumService = {
  /**
   * Fetch timetable entries via GET /api/timetable
   */
  getTimetable: async (params = {}) => {
    try {
      const response = await api.get("/timetable", { params });
      return response.data?.timetable || [];
    } catch (error) {
      console.warn("Failed to fetch timetable from API:", error.message);
      return [];
    }
  },

  /**
   * Fetch subjects from Subject collection via GET /api/subjects
   */
  getSubjects: async () => {
    try {
      const response = await api.get("/subjects");
      return response.data?.subjects || [];
    } catch (error) {
      console.warn("Failed to fetch subjects from API:", error.message);
      return [];
    }
  },

  /**
   * Fetch assignments via GET /api/assignments
   */
  getAssignments: async (params = {}) => {
    try {
      const response = await api.get("/assignments", { params });
      return response.data?.assignments || [];
    } catch (error) {
      console.warn("Failed to fetch assignments from API:", error.message);
      return [];
    }
  },

  /**
   * Fetch exam schedules via GET /api/exams
   */
  getExams: async (params = {}) => {
    try {
      const response = await api.get("/exams", { params });
      return response.data?.exams || [];
    } catch (error) {
      console.warn("Failed to fetch exams from API:", error.message);
      return [];
    }
  },

  /**
   * Fetch user notifications via GET /api/notifications
   */
  getNotifications: async () => {
    try {
      const response = await api.get("/notifications");
      return response.data?.notifications || [];
    } catch (error) {
      console.warn("Failed to fetch notifications from API:", error.message);
      return [];
    }
  },

  /**
   * Create assignment via POST /api/assignments
   */
  createAssignment: async (data) => {
    const response = await api.post("/assignments", data);
    return response.data;
  },

  /**
   * Create exam schedule via POST /api/exams
   */
  createExam: async (data) => {
    const response = await api.post("/exams", data);
    return response.data;
  },

  /**
   * Create timetable entry via POST /api/timetable
   */
  createTimetable: async (data) => {
    const response = await api.post("/timetable", data);
    return response.data;
  },

  /**
   * Mark notification as read via PUT /api/notifications/:id/read
   */
  markNotificationRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  }
};

export default curriculumService;
