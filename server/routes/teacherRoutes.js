// Teacher Routes
// Endpoints for managing faculty records.

const express = require("express");
const router = express.Router();
const { getTeachers, createTeacher } = require("../controllers/teacherController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router
  .route("/")
  .get(protect, getTeachers)
  .post(protect, authorizeRoles("admin"), createTeacher);

module.exports = router;
