const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getStudentAnalytics,
  getTeacherAnalytics,
  getAdminAnalytics
} = require("../controllers/analyticsController");

router.get("/student", protect, getStudentAnalytics);
router.get("/teacher", protect, authorizeRoles("teacher", "admin"), getTeacherAnalytics);
router.get("/admin", protect, authorizeRoles("admin"), getAdminAnalytics);

module.exports = router;
