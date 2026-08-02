const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getExams,
  createExam,
  updateExam,
  deleteExam
} = require("../controllers/examController");

router.route("/")
  .get(protect, getExams)
  .post(protect, authorizeRoles("teacher", "admin"), createExam);

router.route("/:id")
  .put(protect, authorizeRoles("teacher", "admin"), updateExam)
  .delete(protect, authorizeRoles("teacher", "admin"), deleteExam);

module.exports = router;
