import api from "./api";

export const notificationService = {
  /**
   * Fetch all notifications for current user
   * GET /api/notifications
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get("/notifications", { params });
      return response.data?.notifications || [];
    } catch (error) {
      console.warn("Failed to fetch notifications:", error.message);
      return [];
    }
  },

  /**
   * Fetch unread notification count
   * GET /api/notifications/unread-count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      return response.data?.count || 0;
    } catch (error) {
      console.warn("Failed to fetch unread count:", error.message);
      return 0;
    }
  },

  /**
   * Mark single notification as read
   * PUT /api/notifications/:id/read
   */
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark ALL notifications as read
   * PUT /api/notifications/read-all
   */
  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Fetch user notification preferences
   * GET /api/notifications/preferences
   */
  getPreferences: async () => {
    try {
      const response = await api.get("/notifications/preferences");
      return response.data?.preferences || {
        attendance: true,
        assignment: true,
        exam: true,
        timetable: true,
        system: true
      };
    } catch (error) {
      console.warn("Failed to fetch notification preferences:", error.message);
      return {
        attendance: true,
        assignment: true,
        exam: true,
        timetable: true,
        system: true
      };
    }
  },

  /**
   * Update notification preferences
   * PUT /api/notifications/preferences
   */
  updatePreferences: async (preferencesData) => {
    const response = await api.put("/notifications/preferences", preferencesData);
    return response.data;
  }
};

export default notificationService;
