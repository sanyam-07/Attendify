const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable
} = require("../controllers/timetableController");

router.route("/")
  .get(protect, getTimetable)
  .post(protect, authorizeRoles("teacher", "admin"), createTimetable);

router.route("/:id")
  .put(protect, authorizeRoles("teacher", "admin"), updateTimetable)
  .delete(protect, authorizeRoles("teacher", "admin"), deleteTimetable);

module.exports = router;
