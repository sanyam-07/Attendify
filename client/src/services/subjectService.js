// Subject Service
// Connected to backend Express API endpoints /api/subjects.

import api from "./api";

const mockSubjectsList = [
  { _id: "sub1", code: "CS601", name: "AI & Machine Learning", departmentName: "Computer Science", credits: 4 },
  { _id: "sub2", code: "CS602", name: "Database Management Systems", departmentName: "Computer Science", credits: 4 },
  { _id: "sub3", code: "CS603", name: "Web Technologies", departmentName: "Computer Science", credits: 3 },
  { _id: "sub4", code: "CS604", name: "Operating Systems", departmentName: "Computer Science", credits: 4 },
  { _id: "sub5", code: "CS605", name: "Computer Networks", departmentName: "Computer Science", credits: 3 }
];

export const subjectService = {
  /**
   * Get all subjects via GET /api/subjects
   */
  getSubjects: async () => {
    try {
      const response = await api.get("/subjects");
      if (response.data && response.data.success) {
        return response.data.subjects;
      }
    } catch (error) {
      console.warn("Failed to fetch subjects from API. Falling back to dummy data:", error.message);
    }
    return mockSubjectsList;
  },

  /**
   * Create subject via POST /api/subjects
   */
  createSubject: async (subjectData) => {
    try {
      const response = await api.post("/subjects", subjectData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
};

export default subjectService;
