// Subject Routes
// Endpoints for curriculum subjects.

const express = require("express");
const router = express.Router();
const { getSubjects, createSubject } = require("../controllers/subjectController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router
  .route("/")
  .get(protect, getSubjects)
  .post(protect, authorizeRoles("admin", "teacher"), createSubject);

module.exports = router;
