const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userRole = req.user.role === "student" ? "Student" : req.user.role === "teacher" ? "Teacher" : "All";
  const { type, isRead } = req.query;

  const query = {
    $or: [
      { receiverType: "All" },
      { receiverType: userRole },
      { receiver: req.user._id }
    ]
  };

  if (type) query.type = type;
  if (isRead !== undefined) query.isRead = isRead === "true";

  const notifications = await Notification.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications
  });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userRole = req.user.role === "student" ? "Student" : req.user.role === "teacher" ? "Teacher" : "All";

  const count = await Notification.countDocuments({
    $or: [
      { receiverType: "All" },
      { receiverType: userRole },
      { receiver: req.user._id }
    ],
    isRead: false
  });

  res.status(200).json({
    success: true,
    count
  });
});

/**
 * @desc    Create new notification
 * @route   POST /api/notifications
 * @access  Private (Teacher, Admin)
 */
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, receiverType, receiver, type, priority, actionUrl } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error("Please provide title and message");
  }

  const notification = await Notification.create({
    title,
    message,
    receiverType: receiverType || "All",
    receiver: receiver || null,
    createdBy: req.user._id,
    type: type || "System",
    priority: priority || "Medium",
    actionUrl: actionUrl || ""
  });

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    notification
  });
});

/**
 * @desc    Mark single notification as read
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
 * @desc    Mark ALL notifications for user as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userRole = req.user.role === "student" ? "Student" : req.user.role === "teacher" ? "Teacher" : "All";

  await Notification.updateMany(
    {
      $or: [
        { receiverType: "All" },
        { receiverType: userRole },
        { receiver: req.user._id }
      ],
      isRead: false
    },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read"
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
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

/**
 * @desc    Get user notification preferences
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
const getUserPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    preferences: user.notificationPreferences || {
      attendance: true,
      assignment: true,
      exam: true,
      timetable: true,
      system: true
    }
  });
});

/**
 * @desc    Update user notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
const updateUserPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.notificationPreferences = {
    ...user.notificationPreferences,
    ...req.body
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Notification preferences updated successfully",
    preferences: user.notificationPreferences
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUserPreferences,
  updateUserPreferences
};
