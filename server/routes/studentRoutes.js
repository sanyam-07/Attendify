// Student Routes
// Endpoints for managing student records.

const express = require("express");
const router = express.Router();
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent
} = require("../controllers/studentController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router
  .route("/")
  .get(protect, getStudents)
  .post(protect, authorizeRoles("admin", "teacher"), createStudent);

router
  .route("/:id")
  .put(protect, authorizeRoles("admin", "teacher"), updateStudent)
  .delete(protect, authorizeRoles("admin"), deleteStudent);

module.exports = router;
