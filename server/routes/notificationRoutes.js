const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification
} = require("../controllers/notificationController");

router.route("/")
  .get(protect, getNotifications)
  .post(protect, authorizeRoles("teacher", "admin"), createNotification);

router.route("/:id/read")
  .put(protect, markAsRead);

router.route("/:id")
  .delete(protect, authorizeRoles("admin"), deleteNotification);

module.exports = router;
