const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
} = require("../controllers/assignmentController");

router.route("/")
  .get(protect, getAssignments)
  .post(protect, authorizeRoles("teacher", "admin"), createAssignment);

router.route("/:id")
  .put(protect, updateAssignment)
  .delete(protect, authorizeRoles("teacher", "admin"), deleteAssignment);

module.exports = router;
