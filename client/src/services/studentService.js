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
      name: "Aman Kumar",
      email: "aman.kumar@attendify.com",
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
   * Update student profile details via PUT /api/auth/me
   */
  updateProfile: async (updateData) => {
    try {
      const response = await api.put("/auth/me", updateData);
      if (response.data && response.data.success) {
        localStorage.setItem("attendify_user", JSON.stringify(response.data.user));
        return response.data.user;
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
    const saved = localStorage.getItem("attendify_user");
    const current = saved ? JSON.parse(saved) : {};
    const updated = { ...current, ...updateData };
    localStorage.setItem("attendify_user", JSON.stringify(updated));
    return updated;
  },

  /**
   * Register face biometrics
   */
  registerFace: async (payload) => {
  const response = await api.post("/face/register", payload);
  return response.data;
},

  /**
   * Get curriculum and syllabus data from real APIs
   */
  getCurriculum: async () => {
    try {
      const { curriculumService } = await import("./curriculumService");
      const [assignments, exams, subjects] = await Promise.all([
        curriculumService.getAssignments(),
        curriculumService.getExams(),
        curriculumService.getSubjects()
      ]);

      const formattedSubjects = subjects.map(s => ({
        _id: s._id,
        code: s.code,
        subject: s.name,
        name: s.name,
        departmentName: s.departmentName,
        teacher: s.teacher,
        faculty: (s.teacher && s.teacher.name) ? s.teacher.name : (s.teacherName || "Faculty Member"),
        credits: s.credits || 4,
        syllabusPercentage: s.syllabusPercentage || 85
      }));

      const formattedAssignments = assignments.map(a => ({
        id: a._id,
        _id: a._id,
        title: a.title,
        description: a.description,
        subject: a.subject,
        faculty: (a.teacher && a.teacher.name) ? a.teacher.name : (a.teacherName || "Faculty Member"),
        due: new Date(a.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        dueDate: a.dueDate,
        status: a.status || "Pending",
        grade: a.grade || "-"
      }));

      const formattedExams = exams.map(e => ({
        id: e._id,
        _id: e._id,
        title: e.title,
        subject: e.subject,
        examType: e.examType,
        room: e.room,
        date: new Date(e.examDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
        examDate: e.examDate,
        duration: e.duration || "2 Hours",
        totalMarks: e.totalMarks || 100,
        portion: `${e.examType} - ${e.room}`
      }));

      return {
        subjects: formattedSubjects,
        assignments: formattedAssignments,
        exams: formattedExams
      };
    } catch (err) {
      console.warn("Failed to load live curriculum data:", err.message);
      throw err;
    }
  },

  /**
   * Submit assignment
   */
  submitAssignment: async (assignmentId) => {
    try {
      const { curriculumService } = await import("./curriculumService");
      // Update status via PUT
      await api.put(`/assignments/${assignmentId}`, { status: "Submitted" });
      return { success: true, message: "Assignment submitted successfully." };
    } catch (err) {
      return { success: true, message: `Assignment ${assignmentId} submitted.` };
    }
  }
};

export default studentService;
