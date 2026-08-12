const express = require("express");
const router = express.Router();
const { getSubjects, createSubject, updateSubject, deleteSubject } = require("../controllers/subjectController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router
  .route("/")
  .get(protect, getSubjects)
  .post(protect, authorizeRoles("admin", "teacher"), createSubject);

router
  .route("/:id")
  .put(protect, authorizeRoles("admin", "teacher"), updateSubject)
  .delete(protect, authorizeRoles("admin"), deleteSubject);

module.exports = router;
