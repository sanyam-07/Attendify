const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"]
    },
    message: {
      type: String,
      required: [true, "Notification message is required"]
    },
    receiverType: {
      type: String,
      enum: ["All", "Student", "Teacher"],
      default: "All"
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isRead: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ["Attendance", "Assignment", "Exam", "Timetable", "System", "Announcement"],
      default: "System"
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },
    actionUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

notificationSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ receiverType: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
