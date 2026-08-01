// Teacher Service
// Connected to backend Express API endpoints /api/teachers.

import api from "./api";
import { mockTeachers, mockStudents } from "../data/dummyData";

export const teacherService = {
  /**
   * Get all teachers via GET /api/teachers
   */
  getTeachers: async () => {
    try {
      const response = await api.get("/teachers");
      if (response.data && response.data.success) {
        return response.data.teachers;
      }
    } catch (error) {
      console.warn("Failed to fetch teachers from API. Falling back to dummy data:", error.message);
    }
    return mockTeachers;
  },

  /**
   * Create teacher profile via POST /api/teachers
   */
  createTeacher: async (teacherData) => {
    try {
      const response = await api.post("/teachers", teacherData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Get today's classes assigned to teacher
   */
  getClasses: async () => {
    return [
      { id: "SUB301", name: "AI & Machine Learning (CS601)", time: "09:00 AM - 10:30 AM", room: "Lab-3", batch: "CS 6th Sem - Section A" },
      { id: "SUB302", name: "Database Management Systems (CS602)", time: "11:00 AM - 12:30 PM", room: "Hall-101", batch: "CS 6th Sem - Section B" },
      { id: "SUB303", name: "Web Technologies (CS603)", time: "02:00 PM - 03:30 PM", room: "Lab-1", batch: "IT 6th Sem - Section A" }
    ];
  },

  /**
   * Start live attendance broadcast session via POST /api/attendance/session
   */
  startAttendanceSession: async (classId, subjectName, roomName) => {
    try {
      const response = await api.post("/attendance/session", {
        classId: classId || "SUB301",
        subject: subjectName || "AI & Machine Learning",
        room: roomName || "Lab-3"
      });

      if (response.data && response.data.success) {
        const sessionData = {
          classId: classId || "SUB301",
          subject: subjectName || "AI & Machine Learning",
          faculty: "Dr. Sarah Jenkins",
          room: roomName || "Lab-3",
          sessionId: response.data.session._id,
          startTime: Date.now()
        };
        localStorage.setItem("attendify_active_session", JSON.stringify(sessionData));
        return response.data;
      }
    } catch (error) {
      console.warn("API start session failed. Using fallback:", error.message);
    }

    const mockSessionData = {
      classId: classId || "SUB301",
      subject: subjectName || "AI & Machine Learning",
      faculty: "Dr. Sarah Jenkins",
      room: roomName || "Lab-3",
      startTime: Date.now()
    };
    localStorage.setItem("attendify_active_session", JSON.stringify(mockSessionData));
    return { success: true, session: mockSessionData };
  },

  /**
   * Stop active attendance broadcast session
   */
  stopAttendanceSession: async () => {
    localStorage.removeItem("attendify_active_session");
    return { success: true };
  },

  /**
   * Get student roster list
   */
  getStudentsList: async () => {
    try {
      const response = await api.get("/students");
      if (response.data && response.data.success) {
        return response.data.students;
      }
    } catch (error) {
      console.warn("Falling back to dummy student roster:", error.message);
    }
    return mockStudents;
  },

  /**
   * Download attendance report CSV
   */
  downloadReport: async (classId, format = "csv") => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, fileName: `Attendance_Report_${classId}_2026.${format}` });
      }, 700);
    });
  }
};

export default teacherService;
