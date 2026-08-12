const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Reusable Helper to Create and Dispatch Notifications
 */
const createNotificationHelper = async ({
  title,
  message,
  receiverType = "All",
  receiver = null,
  createdBy = null,
  type = "System",
  priority = "Medium",
  actionUrl = ""
}) => {
  try {
    // Avoid duplicate creation if identical notification exists in last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existing = await Notification.findOne({
      title,
      receiver,
      receiverType,
      createdAt: { $gte: tenMinsAgo }
    });

    if (existing) {
      return existing;
    }

    const notification = await Notification.create({
      title,
      message,
      receiverType,
      receiver,
      createdBy,
      type,
      priority,
      actionUrl,
      isRead: false
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

const notifyStudent = async (studentUserId, title, message, type = "System", actionUrl = "") => {
  return await createNotificationHelper({
    title,
    message,
    receiverType: "Student",
    receiver: studentUserId,
    type,
    actionUrl
  });
};

const notifyTeacher = async (teacherUserId, title, message, type = "System", actionUrl = "") => {
  return await createNotificationHelper({
    title,
    message,
    receiverType: "Teacher",
    receiver: teacherUserId,
    type,
    actionUrl
  });
};

const notifyAdmin = async (title, message, type = "System", actionUrl = "") => {
  return await createNotificationHelper({
    title,
    message,
    receiverType: "All",
    type,
    priority: "High",
    actionUrl
  });
};

module.exports = {
  createNotificationHelper,
  notifyStudent,
  notifyTeacher,
  notifyAdmin
};
