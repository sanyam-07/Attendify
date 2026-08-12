const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require("../controllers/departmentController");

router.route("/")
  .get(protect, getDepartments)
  .post(protect, authorizeRoles("admin"), createDepartment);

router.route("/:id")
  .put(protect, authorizeRoles("admin"), updateDepartment)
  .delete(protect, authorizeRoles("admin"), deleteDepartment);

module.exports = router;
