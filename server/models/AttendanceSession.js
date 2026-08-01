// Mongoose Attendance Session Schema
// Live class attendance session broadcast model.

const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    teacherName: {
      type: String
    },
    subject: {
      type: String,
      required: true
    },
    room: {
      type: String,
      required: true
    },
    classId: {
      type: String,
      default: "SUB301"
    },
    duration: {
      type: Number,
      default: 30 // Duration in minutes
    },
    isActive: {
      type: Boolean,
      default: true
    },
    qrCodeToken: {
      type: String,
      default: ""
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AttendanceSession", attendanceSessionSchema);
