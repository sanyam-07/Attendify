const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Helper to compute if a notification is read by the specified user
 */
const isNotifReadByUser = (notif, userId) => {
  if (notif.isRead) return true;
  if (!notif.readBy || !Array.isArray(notif.readBy)) return false;
  return notif.readBy.some(id => id.toString() === userId.toString());
};

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const role = req.user.role;
  const userRole = role === "student" ? "Student" : role === "teacher" ? "Teacher" : "All";
  const { type, isRead } = req.query;

  // Build query
  let query = {};
  if (role === "admin") {
    // Admin sees all notifications
  } else {
    query.$or = [
      { receiverType: "All" },
      { receiverType: userRole },
      { receiver: req.user._id }
    ];
  }

  if (type && type !== "All") {
    query.type = type;
  }

  // User notification preferences filtering
  if (user && user.notificationPreferences) {
    const prefs = user.notificationPreferences;
    const disabledTypes = [];
    if (prefs.attendance === false) disabledTypes.push("Attendance");
    if (prefs.assignment === false) disabledTypes.push("Assignment");
    if (prefs.exam === false) disabledTypes.push("Exam");
    if (prefs.timetable === false) disabledTypes.push("Timetable");
    if (prefs.system === false) disabledTypes.push("System");

    if (disabledTypes.length > 0) {
      query.type = { $nin: disabledTypes };
    }
  }

  let notifications = await Notification.find(query).sort({ createdAt: -1 });

  // Map notifications with user-specific read status
  const formatted = notifications.map(n => {
    const readStatus = isNotifReadByUser(n, req.user._id);
    return {
      _id: n._id,
      id: n._id,
      title: n.title,
      message: n.message,
      receiverType: n.receiverType,
      receiver: n.receiver,
      type: n.type,
      priority: n.priority,
      actionUrl: n.actionUrl,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      isRead: readStatus,
      read: readStatus
    };
  });

  // Filter by isRead parameter if provided
  let result = formatted;
  if (isRead !== undefined) {
    const targetIsRead = isRead === "true";
    result = formatted.filter(n => n.isRead === targetIsRead);
  }

  res.status(200).json({
    success: true,
    count: result.length,
    notifications: result
  });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const role = req.user.role;
  const userRole = role === "student" ? "Student" : role === "teacher" ? "Teacher" : "All";

  let query = {};
  if (role === "admin") {
    // Admin
  } else {
    query.$or = [
      { receiverType: "All" },
      { receiverType: userRole },
      { receiver: req.user._id }
    ];
  }

  if (user && user.notificationPreferences) {
    const prefs = user.notificationPreferences;
    const disabledTypes = [];
    if (prefs.attendance === false) disabledTypes.push("Attendance");
    if (prefs.assignment === false) disabledTypes.push("Assignment");
    if (prefs.exam === false) disabledTypes.push("Exam");
    if (prefs.timetable === false) disabledTypes.push("Timetable");
    if (prefs.system === false) disabledTypes.push("System");

    if (disabledTypes.length > 0) {
      query.type = { $nin: disabledTypes };
    }
  }

  const notifications = await Notification.find(query);
  const unreadCount = notifications.filter(n => !isNotifReadByUser(n, req.user._id)).length;

  res.status(200).json({
    success: true,
    count: unreadCount
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
 * @desc    Mark single notification as read or unread
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  let notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  // Determine target state (defaults to true if not specified)
  const targetReadState = req.body.isRead !== undefined ? Boolean(req.body.isRead) : true;

  if (targetReadState) {
    // Mark as read
    if (!notification.readBy) notification.readBy = [];
    if (!notification.readBy.some(id => id.toString() === req.user._id.toString())) {
      notification.readBy.push(req.user._id);
    }
    if (notification.receiver && notification.receiver.toString() === req.user._id.toString()) {
      notification.isRead = true;
    }
  } else {
    // Mark as unread
    if (notification.readBy) {
      notification.readBy = notification.readBy.filter(id => id.toString() !== req.user._id.toString());
    }
    if (notification.receiver && notification.receiver.toString() === req.user._id.toString()) {
      notification.isRead = false;
    }
  }

  await notification.save();

  res.status(200).json({
    success: true,
    message: `Notification marked as ${targetReadState ? "read" : "unread"}`,
    notification: {
      _id: notification._id,
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
      isRead: targetReadState,
      read: targetReadState
    }
  });
});

/**
 * @desc    Mark ALL notifications for user as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const userRole = role === "student" ? "Student" : role === "teacher" ? "Teacher" : "All";

  let query = {};
  if (role === "admin") {
    // Admin
  } else {
    query.$or = [
      { receiverType: "All" },
      { receiverType: userRole },
      { receiver: req.user._id }
    ];
  }

  // Add user to readBy array for all matching notifications
  await Notification.updateMany(query, {
    $addToSet: { readBy: req.user._id }
  });

  // Also update direct notifications
  await Notification.updateMany({ receiver: req.user._id }, {
    $set: { isRead: true }
  });

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
    preferences: (user && user.notificationPreferences) ? user.notificationPreferences : {
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
    attendance: req.body.attendance !== undefined ? Boolean(req.body.attendance) : (user.notificationPreferences?.attendance ?? true),
    assignment: req.body.assignment !== undefined ? Boolean(req.body.assignment) : (user.notificationPreferences?.assignment ?? true),
    exam: req.body.exam !== undefined ? Boolean(req.body.exam) : (user.notificationPreferences?.exam ?? true),
    timetable: req.body.timetable !== undefined ? Boolean(req.body.timetable) : (user.notificationPreferences?.timetable ?? true),
    system: req.body.system !== undefined ? Boolean(req.body.system) : (user.notificationPreferences?.system ?? true)
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
