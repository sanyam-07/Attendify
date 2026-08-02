const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"]
    },
    subject: {
      type: String,
      required: [true, "Subject is required"]
    },
    examType: {
      type: String,
      enum: ["Mid-Term", "Final", "Quiz", "Lab Practical"],
      default: "Mid-Term"
    },
    room: {
      type: String,
      default: "Auditorium A"
    },
    examDate: {
      type: Date,
      required: [true, "Exam date is required"]
    },
    duration: {
      type: String,
      default: "2 Hours"
    },
    totalMarks: {
      type: Number,
      default: 100
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
