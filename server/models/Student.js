// Mongoose Student Profile Schema
// Extends User model with academic student metadata and attendance tracking metrics.

const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    enrollmentNo: {
      type: String,
      required: [true, "Enrollment number is required"],
      unique: true,
      trim: true
    },
    department: {
      type: String,
      default: "Computer Science"
    },
    semester: {
      type: String,
      default: "6th Semester"
    },
    overallAttendance: {
      type: Number,
      default: 85.0
    },
    presentDays: {
      type: Number,
      default: 68
    },
    absentDays: {
      type: Number,
      default: 10
    },
    lateDays: {
      type: Number,
      default: 2
    },
    faceRegistered: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Student", studentSchema);
