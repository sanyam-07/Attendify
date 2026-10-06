import api from "./api";

export const curriculumService = {
  /**
   * Fetch timetable entries via GET /api/timetable
   */
  getTimetable: async (params = {}) => {
    const response = await api.get("/timetable", { params });
    return response.data?.timetable || [];
  },

  getSubjects: async () => {
    const response = await api.get("/subjects");
    return response.data?.subjects || [];
  },

  getAssignments: async (params = {}) => {
    const response = await api.get("/assignments", { params });
    return response.data?.assignments || [];
  },

  getExams: async (params = {}) => {
    const response = await api.get("/exams", { params });
    return response.data?.exams || [];
  },

  getNotifications: async () => {
    const response = await api.get("/notifications");
    return response.data?.notifications || [];
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
