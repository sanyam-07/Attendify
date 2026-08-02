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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
