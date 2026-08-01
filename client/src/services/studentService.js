// Student Service
// Connected to backend Express API endpoints /api/students.

import api from "./api";
import { mockStudents } from "../data/dummyData";

export const studentService = {
  /**
   * Get all students via GET /api/students
   */
  getStudents: async () => {
    try {
      const response = await api.get("/students");
      if (response.data && response.data.success) {
        return response.data.students;
      }
    } catch (error) {
      console.warn("Failed to fetch students from API. Falling back to dummy data:", error.message);
    }
    return mockStudents;
  },

  /**
   * Create a student via POST /api/students
   */
  createStudent: async (studentData) => {
    try {
      const response = await api.post("/students", studentData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Update student profile via PUT /api/students/:id
   */
  updateStudent: async (id, updateData) => {
    try {
      const response = await api.put(`/students/${id}`, updateData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Delete student record via DELETE /api/students/:id
   */
  deleteStudent: async (id) => {
    try {
      const response = await api.delete(`/students/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Get authenticated student profile details
   */
  getProfile: async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data && response.data.success) {
        return response.data.user;
      }
    } catch (error) {
      console.warn("Using cached/dummy student profile:", error.message);
    }

    const saved = localStorage.getItem("attendify_user");
    if (saved) return JSON.parse(saved);

    return {
      name: "Alex Rivera",
      email: "alex.rivera@attendify.com",
      enrollmentNo: "CS20261001",
      department: "Computer Science",
      semester: "6th Semester",
      overallAttendance: 88.4,
      presentDays: 62,
      absentDays: 8,
      lateDays: 2,
      faceRegistered: true,
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120"
    };
  },

  /**
   * Register face biometrics
   */
  registerFace: async (payload) => {
  const response = await api.post("/face/register", payload);
  return response.data;
},

  /**
   * Get curriculum and syllabus data
   */
  getCurriculum: async () => {
    return {
      subjects: [
        { code: "CS601", subject: "AI & Machine Learning", faculty: "Dr. Sarah Jenkins", syllabus: 85 },
        { code: "CS602", subject: "Database Management Systems", faculty: "Prof. David Wilson", syllabus: 78 },
        { code: "CS603", subject: "Web Technologies", faculty: "Dr. Michael Brown", syllabus: 92 },
        { code: "CS604", subject: "Operating Systems", faculty: "Dr. Sarah Jenkins", syllabus: 70 },
        { code: "CS605", subject: "Computer Networks", faculty: "Prof. David Wilson", syllabus: 88 }
      ],
      assignments: [
        { id: "asg1", title: "Lab 3: Neural Network Classification", subject: "AI & Machine Learning", due: "Tomorrow, 11:59 PM", status: "Pending", grade: "-" },
        { id: "asg2", title: "SQL Index Optimization Query Sheet", subject: "Database Management Systems", due: "Jun 24, 2026", status: "Submitted", grade: "A+" }
      ],
      exams: [
        { id: "ex1", title: "Mid-Semester Practical", subject: "AI & Machine Learning", date: "Jul 10, 2026", time: "10:00 AM", portion: "Units 1 to 3" },
        { id: "ex2", title: "End-Semester Theory", subject: "Database Management Systems", date: "Jul 18, 2026", time: "02:00 PM", portion: "All Units" }
      ]
    };
  },

  /**
   * Submit mock assignment
   */
  submitAssignment: async (assignmentId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: `Assignment ${assignmentId} submitted.` });
      }, 800);
    });
  }
};

export default studentService;
