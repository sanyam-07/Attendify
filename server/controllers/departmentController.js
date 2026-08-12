const asyncHandler = require("express-async-handler");
const Department = require("../models/Department");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

/**
 * @desc    Get all departments with student & teacher counts
 * @route   GET /api/departments
 * @access  Private
 */
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });

  const deptData = await Promise.all(
    departments.map(async (dept) => {
      const studentCount = await Student.countDocuments({ department: dept.name });
      const teacherCount = await Teacher.countDocuments({ department: dept.name });
      return {
        _id: dept._id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        studentCount,
        teacherCount
      };
    })
  );

  res.status(200).json({
    success: true,
    count: deptData.length,
    departments: deptData
  });
});

/**
 * @desc    Create new department
 * @route   POST /api/departments
 * @access  Private (Admin)
 */
const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;

  if (!name || !code) {
    res.status(400);
    throw new Error("Department name and code are required");
  }

  const existing = await Department.findOne({ $or: [{ name }, { code }] });
  if (existing) {
    res.status(400);
    throw new Error("Department with this name or code already exists");
  }

  const department = await Department.create({
    name,
    code,
    description: description || ""
  });

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    department
  });
});

/**
 * @desc    Update department
 * @route   PUT /api/departments/:id
 * @access  Private (Admin)
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  const { name, code, description } = req.body;
  if (name) department.name = name;
  if (code) department.code = code;
  if (description !== undefined) department.description = description;

  await department.save();

  res.status(200).json({
    success: true,
    message: "Department updated successfully",
    department
  });
});

/**
 * @desc    Delete department
 * @route   DELETE /api/departments/:id
 * @access  Private (Admin)
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  await department.deleteOne();

  res.status(200).json({
    success: true,
    message: "Department deleted successfully"
  });
});

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
