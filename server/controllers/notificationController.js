const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userRole = req.user.role === "student" ? "Student" : req.user.role === "teacher" ? "Teacher" : "All";

  const notifications = await Notification.find({
    $or: [
      { receiverType: "All" },
      { receiverType: userRole },
      { receiver: req.user._id }
    ]
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications
  });
});

/**
 * @desc    Create new notification
 * @route   POST /api/notifications
 * @access  Private (Teacher, Admin)
 */
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, receiverType, receiver } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error("Please provide title and message");
  }

  const notification = await Notification.create({
    title,
    message,
    receiverType: receiverType || "All",
    receiver: receiver || null,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    notification
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  let notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    notification
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Admin)
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully"
  });
});

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification
};
