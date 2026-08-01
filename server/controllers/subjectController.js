// Subject Controller
// Handles operations for curriculum subject modules.

const asyncHandler = require("express-async-handler");
const Subject = require("../models/Subject");

/**
 * @desc    Get all subjects
 * @route   GET /api/subjects
 * @access  Private
 */
const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().populate("teacher", "name email");

  res.json({
    success: true,
    count: subjects.length,
    subjects
  });
});

/**
 * @desc    Create a new subject
 * @route   POST /api/subjects
 * @access  Private (Admin, Teacher)
 */
const createSubject = asyncHandler(async (req, res) => {
  const { name, code, departmentName, credits } = req.body;

  if (!name || !code) {
    res.status(400);
    throw new Error("Subject name and code are required.");
  }

  const subjectExists = await Subject.findOne({ code });
  if (subjectExists) {
    res.status(400);
    throw new Error("Subject with this code already exists.");
  }

  const subject = await Subject.create({
    name,
    code,
    departmentName: departmentName || "Computer Science",
    teacher: req.user._id,
    credits: credits || 4
  });

  res.status(201).json({
    success: true,
    message: "Subject created successfully",
    subject
  });
});

module.exports = {
  getSubjects,
  createSubject
};
