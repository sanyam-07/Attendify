const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getDashboardStats,
  getStudents,
  updateStudent,
  deleteStudent,
  getTeachers,
  updateTeacher,
  deleteTeacher,
  globalSearch,
  getAttendanceLogs,
  getFaceAiStats,
  getAuditLogs
} = require("../controllers/adminController");

// All admin routes require authentication AND admin role
router.use(protect, authorizeRoles("admin"));

router.get("/dashboard-stats", getDashboardStats);
router.get("/search", globalSearch);
router.get("/attendance", getAttendanceLogs);
router.get("/face-stats", getFaceAiStats);

router.route("/students")
  .get(getStudents);

router.route("/students/:id")
  .put(updateStudent)
  .delete(deleteStudent);

router.route("/teachers")
  .get(getTeachers);

router.route("/teachers/:id")
  .put(updateTeacher)
  .delete(deleteTeacher);

router.get("/audit-logs", getAuditLogs);

module.exports = router;
