// Mongoose Attendance Record Schema
// Individual student check-in log record.

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    studentName: {
      type: String
    },
    subject: {
      type: String,
      required: true
    },
    faculty: {
      type: String,
      required: true
    },
    room: {
      type: String,
      default: "Hall 101"
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late"],
      default: "Present"
    },
    method: {
      type: String,
      enum: ["Face ID", "QR Scan", "Manual Override"],
      default: "Face ID"
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceSession"
    },
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Performance Indexes for high-frequency queries & aggregation
attendanceSchema.index({ student: 1, verifiedAt: -1 });
attendanceSchema.index({ method: 1, status: 1 });
attendanceSchema.index({ session: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
