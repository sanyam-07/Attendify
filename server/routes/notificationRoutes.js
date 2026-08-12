const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserPreferences,
  updateUserPreferences
} = require("../controllers/notificationController");

router.route("/")
  .get(protect, getNotifications)
  .post(protect, authorizeRoles("teacher", "admin"), createNotification);

router.get("/unread-count", protect, getUnreadCount);

router.put("/read-all", protect, markAllAsRead);

router.route("/preferences")
  .get(protect, getUserPreferences)
  .put(protect, updateUserPreferences);

router.put("/:id/read", protect, markAsRead);

router.delete("/:id", protect, deleteNotification);

module.exports = router;
