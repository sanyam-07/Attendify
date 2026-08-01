// Analytics Mock Service
// Convert this to '/api/analytics/*' Express endpoints in the MERN stack.

import { 
  weeklyStats, 
  monthlyStats, 
  subjectAttendance, 
  heatmapData, 
  adminStats, 
  mockTeachers, 
  mockStudents 
} from "../data/dummyData";

const API_DELAY = 700;

export const analyticsService = {
  /**
   * Fetch analytical records for a student
   */
  getStudentAnalytics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          weeklyStats,
          monthlyStats,
          subjectAttendance,
          heatmapData,
          // Context-aware AI recommendation card engine
          aiRecommendations: [
            {
              id: "r1",
              subject: "Database Management Systems",
              message: "Your attendance is at 70.6% (critical limit is 75%). You need to attend 3 more Database lectures to recover safe compliance.",
              severity: "danger",
              actionLink: "/attendance"
            },
            {
              id: "r2",
              subject: "Computer Networks",
              message: "Currently at 68.7% attendance. Focus on attending upcoming network practical labs to cross the passing thresholds.",
              severity: "warning",
              actionLink: "/attendance"
            },
            {
              id: "r3",
              subject: "AI & Machine Learning",
              message: "Exemplary performance! Currently at 88.8%. Maintain this streak to qualify for the high-achiever academic badge.",
              severity: "success",
              actionLink: null
            }
          ]
        });
      }, API_DELAY);
    });
  },

  /**
   * Fetch global analytics for administration
   */
  getAdminAnalytics: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          summaryCards: {
            totalStudents: adminStats.totalStudents,
            totalTeachers: adminStats.totalTeachers,
            totalDepartments: adminStats.totalDepartments,
            averageAttendance: adminStats.averageAttendance
          },
          departmentStats: adminStats.departmentStats,
          systemActivities: adminStats.systemActivities,
          teachers: mockTeachers,
          students: mockStudents
        });
      }, API_DELAY);
    });
  }
};
export default analyticsService;
