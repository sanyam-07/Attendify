const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Assignment title is required"]
    },
    description: {
      type: String,
      default: ""
    },
    subject: {
      type: String,
      required: [true, "Subject is required"]
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    teacherName: {
      type: String,
      default: "Dr. Sarah Jenkins"
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"]
    },
    attachments: [
      {
        type: String
      }
    ],
    status: {
      type: String,
      enum: ["Pending", "Submitted", "Graded"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
