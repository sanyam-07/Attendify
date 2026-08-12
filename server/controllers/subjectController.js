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
  const { name, code, departmentName, credits, syllabusPercentage } = req.body;

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
    credits: credits || 4,
    syllabusPercentage: syllabusPercentage || 85
  });

  res.status(201).json({
    success: true,
    message: "Subject created successfully",
    subject
  });
});

/**
 * @desc    Update subject
 * @route   PUT /api/subjects/:id
 * @access  Private (Admin, Teacher)
 */
const updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }

  const { name, code, departmentName, syllabusPercentage, teacher, credits } = req.body;
  if (name) subject.name = name;
  if (code) subject.code = code;
  if (departmentName) subject.departmentName = departmentName;
  if (syllabusPercentage !== undefined) subject.syllabusPercentage = syllabusPercentage;
  if (teacher) subject.teacher = teacher;
  if (credits) subject.credits = credits;

  await subject.save();

  res.status(200).json({
    success: true,
    message: "Subject updated successfully",
    subject
  });
});

/**
 * @desc    Delete subject
 * @route   DELETE /api/subjects/:id
 * @access  Private (Admin)
 */
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    res.status(404);
    throw new Error("Subject not found");
  }

  await subject.deleteOne();

  res.status(200).json({
    success: true,
    message: "Subject deleted successfully"
  });
});

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};
