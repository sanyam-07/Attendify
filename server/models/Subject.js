// Mongoose Subject Schema
// Course subject curriculum representation.

const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      unique: true,
      uppercase: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    },
    departmentName: {
      type: String,
      default: "Computer Science"
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    credits: {
      type: Number,
      default: 4
    },
    syllabusPercentage: {
      type: Number,
      default: 85
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Subject", subjectSchema);
