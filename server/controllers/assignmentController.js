const asyncHandler = require("express-async-handler");
const Assignment = require("../models/Assignment");

/**
 * @desc    Get assignments
 * @route   GET /api/assignments
 * @access  Private
 */
const getAssignments = asyncHandler(async (req, res) => {
  const { subject, status } = req.query;
  let filter = {};

  if (subject) filter.subject = subject;
  if (status) filter.status = status;

  const assignments = await Assignment.find(filter).sort({ dueDate: 1 });

  res.status(200).json({
    success: true,
    count: assignments.length,
    assignments
  });
});

/**
 * @desc    Create new assignment
 * @route   POST /api/assignments
 * @access  Private (Teacher, Admin)
 */
const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subject, dueDate, attachments, teacherName } = req.body;

  if (!title || !subject || !dueDate) {
    res.status(400);
    throw new Error("Please provide title, subject, and dueDate");
  }

  const assignment = await Assignment.create({
    title,
    description: description || "",
    subject,
    teacher: req.user._id,
    teacherName: teacherName || req.user.name,
    dueDate,
    attachments: attachments || [],
    status: "Pending"
  });

  res.status(201).json({
    success: true,
    message: "Assignment created successfully",
    assignment
  });
});

/**
 * @desc    Update assignment
 * @route   PUT /api/assignments/:id
 * @access  Private
 */
const updateAssignment = asyncHandler(async (req, res) => {
  let assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: "Assignment updated successfully",
    assignment
  });
});

/**
 * @desc    Delete assignment
 * @route   DELETE /api/assignments/:id
 * @access  Private (Teacher, Admin)
 */
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error("Assignment not found");
  }

  await assignment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Assignment deleted successfully"
  });
});

module.exports = {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment
};
