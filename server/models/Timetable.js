const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Subject name is required"]
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    teacherName: {
      type: String,
      default: "Dr. Sarah Jenkins"
    },
    department: {
      type: String,
      default: "Computer Science & AI"
    },
    semester: {
      type: Number,
      default: 6
    },
    section: {
      type: String,
      default: "A"
    },
    room: {
      type: String,
      required: [true, "Room is required"]
    },
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: [true, "Day of week is required"]
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"]
    },
    endTime: {
      type: String,
      required: [true, "End time is required"]
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
