import api from "./api";

export const adminService = {
  /**
   * Fetch Overview Metrics
   * GET /api/admin/dashboard-stats
   */
  getDashboardStats: async () => {
    try {
      const res = await api.get("/admin/dashboard-stats");
      return res.data;
    } catch (error) {
      console.warn("Failed to fetch admin stats:", error.message);
      return null;
    }
  },

  /**
   * Global Search
   * GET /api/admin/search
   */
  globalSearch: async (q) => {
    try {
      const res = await api.get("/admin/search", { params: { q } });
      return res.data?.results || { students: [], teachers: [], subjects: [], departments: [] };
    } catch (error) {
      console.warn("Failed to execute admin global search:", error.message);
      return { students: [], teachers: [], subjects: [], departments: [] };
    }
  },

  /**
   * Fetch Attendance Logs
   * GET /api/admin/attendance
   */
  getAttendanceLogs: async (params = {}) => {
    try {
      const res = await api.get("/admin/attendance", { params });
      return res.data?.logs || [];
    } catch (error) {
      console.warn("Failed to fetch attendance logs:", error.message);
      return [];
    }
  },

  /**
   * Fetch Face AI & QR Verification Stats
   * GET /api/admin/face-stats
   */
  getFaceAiStats: async () => {
    try {
      const res = await api.get("/admin/face-stats");
      return res.data;
    } catch (error) {
      console.warn("Failed to fetch face AI stats:", error.message);
      return null;
    }
  },

  /**
   * Fetch Departments List
   * GET /api/departments
   */
  getDepartments: async () => {
    try {
      const res = await api.get("/departments");
      return res.data?.departments || [];
    } catch (error) {
      console.warn("Failed to fetch departments:", error.message);
      return [];
    }
  },

  /**
   * Create Department
   * POST /api/departments
   */
  createDepartment: async (data) => {
    const res = await api.post("/departments", data);
    return res.data;
  },

  /**
   * Update Department
   * PUT /api/departments/:id
   */
  updateDepartment: async (id, data) => {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
  },

  /**
   * Delete Department
   * DELETE /api/departments/:id
   */
  deleteDepartment: async (id) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },

  /**
   * Fetch Paginated Students
   * GET /api/admin/students
   */
  getStudents: async (params = {}) => {
    try {
      const res = await api.get("/admin/students", { params });
      return res.data;
    } catch (error) {
      console.warn("Failed to fetch students list:", error.message);
      return { students: [], total: 0, pages: 1 };
    }
  },

  /**
   * Update Student Record
   * PUT /api/admin/students/:id
   */
  updateStudent: async (id, data) => {
    const res = await api.put(`/admin/students/${id}`, data);
    return res.data;
  },

  /**
   * Delete Student Record
   * DELETE /api/admin/students/:id
   */
  deleteStudent: async (id) => {
    const res = await api.delete(`/admin/students/${id}`);
    return res.data;
  },

  /**
   * Fetch Teachers List
   * GET /api/admin/teachers
   */
  getTeachers: async (params = {}) => {
    try {
      const res = await api.get("/admin/teachers", { params });
      return res.data;
    } catch (error) {
      console.warn("Failed to fetch teachers list:", error.message);
      return { teachers: [], count: 0 };
    }
  },

  /**
   * Update Teacher Record
   * PUT /api/admin/teachers/:id
   */
  updateTeacher: async (id, data) => {
    const res = await api.put(`/admin/teachers/${id}`, data);
    return res.data;
  },

  /**
   * Delete Teacher Record
   * DELETE /api/admin/teachers/:id
   */
  deleteTeacher: async (id) => {
    const res = await api.delete(`/admin/teachers/${id}`);
    return res.data;
  },

  /**
   * Fetch Admin Audit Logs
   * GET /api/admin/audit-logs
   */
  getAuditLogs: async (params = {}) => {
    try {
      const res = await api.get("/admin/audit-logs", { params });
      return res.data;
    } catch (error) {
      console.warn("Failed to fetch audit logs:", error.message);
      return { logs: [], total: 0 };
    }
  }
};

export default adminService;
