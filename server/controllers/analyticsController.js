const asyncHandler = require("express-async-handler");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const AttendanceSession = require("../models/AttendanceSession");
const User = require("../models/User");
const Notification = require("../models/Notification");

/**
 * Helper: calculate required consecutive classes to hit target percentage
 * Formula: Target = (P + x) / (T + x) => x = (Target * T - P) / (1 - Target)
 */
const calculateRequiredClasses = (present, total, targetPct) => {
  if (total === 0) return 0;
  const currentPct = (present / total) * 100;
  if (currentPct >= targetPct) return 0;
  
  const targetDecimal = targetPct / 100;
  const required = Math.ceil((targetDecimal * total - present) / (1 - targetDecimal));
  return required > 0 ? required : 0;
};

/**
 * Helper: calculate safe missable classes while staying above target percentage
 * Formula: (P) / (T + x) >= Target => x <= (P - Target * T) / Target
 */
const calculateSafeMisses = (present, total, targetPct) => {
  if (total === 0) return 0;
  const targetDecimal = targetPct / 100;
  const missable = Math.floor((present - targetDecimal * total) / targetDecimal);
  return missable > 0 ? missable : 0;
};

/**
 * @desc    Get Student Analytics & AI Intelligence
 * @route   GET /api/analytics/student
 * @access  Private (Student)
 */
const getStudentAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userName = req.user.name;

  const studentQuery = {
    $or: [{ student: userId }, { studentName: userName }]
  };

  const records = await Attendance.find(studentQuery).sort({ verifiedAt: -1 }).lean();

  const totalClasses = records.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  records.forEach((r) => {
    if (r.status === "Present") presentCount++;
    else if (r.status === "Absent") absentCount++;
    else if (r.status === "Late") lateCount++;
  });

  const effectivePresent = presentCount + lateCount * 0.5;
  const attendancePercentage = totalClasses > 0 
    ? parseFloat(((effectivePresent / totalClasses) * 100).toFixed(1))
    : 0.0;

  // AI Risk Engine Assessment
  const riskScore = Math.min(100, Math.max(0, Math.round(attendancePercentage)));
  let riskLevel = "Safe";
  let color = "emerald";
  let explanation = "Excellent attendance record. You are safely compliant.";

  if (totalClasses === 0) {
    riskLevel = "Safe";
    color = "emerald";
    explanation = "No attendance records found yet. Attend upcoming lectures to establish your profile.";
  } else if (attendancePercentage >= 80) {
    riskLevel = "Safe";
    color = "emerald";
    explanation = "Excellent attendance record. You are safely above the 75% requirement.";
  } else if (attendancePercentage >= 60) {
    riskLevel = "Warning";
    color = "amber";
    explanation = "Attendance requires attention to maintain university 75% compliance requirement.";
  } else if (attendancePercentage >= 40) {
    riskLevel = "Risk";
    color = "orange";
    explanation = "Attendance is in the danger zone. High risk of shortage.";
  } else {
    riskLevel = "Critical";
    color = "red";
    explanation = "Critical attendance shortage! Immediate intervention required.";
  }

  // Attendance Forecasts
  const forecast5Best = totalClasses > 0
    ? parseFloat((((effectivePresent + 5) / (totalClasses + 5)) * 100).toFixed(1))
    : 100.0;
  const forecast5Worst = totalClasses > 0
    ? parseFloat(((effectivePresent / (totalClasses + 5)) * 100).toFixed(1))
    : 0.0;

  const forecast10Best = totalClasses > 0
    ? parseFloat((((effectivePresent + 10) / (totalClasses + 10)) * 100).toFixed(1))
    : 100.0;
  const forecast10Worst = totalClasses > 0
    ? parseFloat(((effectivePresent / (totalClasses + 10)) * 100).toFixed(1))
    : 0.0;

  const attendanceForecast = {
    next5: { bestCase: forecast5Best, worstCase: forecast5Worst },
    next10: { bestCase: forecast10Best, worstCase: forecast10Worst }
  };

  // Predictor Targets
  const req75 = calculateRequiredClasses(effectivePresent, totalClasses, 75);
  const req80 = calculateRequiredClasses(effectivePresent, totalClasses, 80);
  const req90 = calculateRequiredClasses(effectivePresent, totalClasses, 90);
  const safeMisses = calculateSafeMisses(effectivePresent, totalClasses, 75);

  // Dynamic Personalized Recommendations
  const recommendations = [];
  if (attendancePercentage < 75 && totalClasses > 0) {
    recommendations.push(`Attend the next ${req75} consecutive lectures to recover 75% compliance.`);
  } else if (safeMisses > 0) {
    recommendations.push(`You may safely miss up to ${safeMisses} lecture(s) while staying above 75%.`);
  } else {
    recommendations.push("Maintain your current attendance pattern to stay safely compliant.");
  }

  // Subject-wise Breakdown & Risk Ranking
  const subjectAgg = await Attendance.aggregate([
    { $match: studentQuery },
    {
      $group: {
        _id: "$subject",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } }
      }
    }
  ]);

  const subjectRisk = subjectAgg.map((s) => {
    const total = s.total || 1;
    const eff = s.present + s.late * 0.5;
    const pct = parseFloat(((eff / total) * 100).toFixed(1));
    
    let subRisk = "Low Risk";
    let subRec = "On Track";

    if (pct < 75) {
      subRisk = "High Risk";
      const subReq = calculateRequiredClasses(eff, total, 75);
      subRec = `Attend next ${subReq} classes`;
      recommendations.push(`${s._id || 'Subject'} attendance is low (${pct}%). ${subRec}.`);
    } else {
      const subSafe = calculateSafeMisses(eff, total, 75);
      subRec = subSafe > 0 ? `Can miss ${subSafe} class(es)` : "On Track";
    }

    return {
      subject: s._id || "General",
      total: s.total,
      present: s.present,
      absent: s.absent,
      late: s.late,
      percentage: pct,
      risk: subRisk,
      recommendation: subRec
    };
  }).sort((a, b) => a.percentage - b.percentage); // Lowest attendance first

  // Automatic Notification Creation for Risk Alerts
  if (attendancePercentage > 0 && attendancePercentage < 75) {
    const existingNotif = await Notification.findOne({
      receiver: userId,
      title: "Attendance Warning Alert",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (!existingNotif) {
      await Notification.create({
        receiver: userId,
        receiverType: "Student",
        sender: userId,
        senderName: "AI Intelligence Engine",
        title: "Attendance Warning Alert",
        message: `Your overall attendance is currently ${attendancePercentage}%. Please attend upcoming lectures to avoid shortage.`,
        type: "Alert",
        category: "System",
        priority: "High",
        actionUrl: "/progress"
      });
    }
  }

  // Weekly & Monthly Trends
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyTrend = daysOfWeek.map((day, idx) => {
    const dayRecords = records.filter(r => new Date(r.verifiedAt).getDay() === idx);
    const pres = dayRecords.filter(r => r.status === "Present").length;
    const abs = dayRecords.filter(r => r.status === "Absent").length;
    const total = dayRecords.length;
    return {
      day,
      present: pres,
      absent: abs,
      percentage: total > 0 ? parseFloat(((pres / total) * 100).toFixed(1)) : 0
    };
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIdx = new Date().getMonth();
  const recentMonths = months.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1);

  const monthlyTrend = recentMonths.map((month) => {
    const mIdx = months.indexOf(month);
    const mRecords = records.filter(r => new Date(r.verifiedAt).getMonth() === mIdx);
    const pres = mRecords.filter(r => r.status === "Present").length;
    const total = mRecords.length;
    return {
      month,
      present: pres,
      absent: mRecords.filter(r => r.status === "Absent").length,
      percentage: total > 0 ? parseFloat(((pres / total) * 100).toFixed(1)) : 0
    };
  });

  // Attendance Heatmap for past 30 days
  const attendanceHeatmap = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const match = records.find(r => new Date(r.verifiedAt).toISOString().split("T")[0] === dateStr);
    attendanceHeatmap.push({
      date: dateStr,
      count: match ? 1 : 0,
      status: match ? match.status : "No Class"
    });
  }

  res.status(200).json({
    success: true,
    overallAttendance: attendancePercentage,
    attendancePercentage,
    presentCount,
    absentCount,
    lateCount,
    totalClasses,
    riskScore,
    riskLevel,
    color,
    explanation,
    attendanceForecast,
    requiredClassesToReach75: req75,
    requiredClassesToReach80: req80,
    requiredClassesToReach90: req90,
    safeMisses,
    recommendations,
    subjectWiseAttendance: subjectRisk,
    subjectRisk,
    weeklyTrend,
    monthlyTrend,
    attendanceHeatmap,
    recentAttendance: records.slice(0, 10)
  });
});

/**
 * @desc    Get Teacher Analytics & Faculty Intelligence
 * @route   GET /api/analytics/teacher
 * @access  Private (Teacher, Admin)
 */
const getTeacherAnalytics = asyncHandler(async (req, res) => {
  const [allRecords, totalStudents, allStudents] = await Promise.all([
    Attendance.find().sort({ verifiedAt: -1 }).lean(),
    Student.countDocuments(),
    Student.find().populate("user", "name email").lean()
  ]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = allRecords.filter(
    r => new Date(r.verifiedAt).toISOString().split("T")[0] === todayStr
  );

  const uniquePresentNames = new Set(
    todayRecords.filter(r => r.status === "Present").map(r => r.studentName || r.student?.toString())
  );
  const uniqueLateNames = new Set(
    todayRecords.filter(r => r.status === "Late").map(r => r.studentName || r.student?.toString())
  );

  const presentStudents = Math.min(uniquePresentNames.size, totalStudents);
  const lateStudents = uniqueLateNames.size;
  const absentStudents = Math.max(0, totalStudents - presentStudents);

  const totalClasses = allRecords.length || 1;
  const overallPresent = allRecords.filter(r => r.status === "Present").length;
  const overallClassAttendance = parseFloat(((overallPresent / totalClasses) * 100).toFixed(1));

  // Subject Statistics
  const subjectAgg = await Attendance.aggregate([
    {
      $group: {
        _id: "$subject",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
      }
    }
  ]);

  const subjectStatistics = subjectAgg.map(s => ({
    subject: s._id || "Computer Science",
    averageAttendance: parseFloat(((s.present / (s.total || 1)) * 100).toFixed(1)),
    totalStudents,
    presentToday: presentStudents
  })).sort((a, b) => a.averageAttendance - b.averageAttendance);

  const lowestAttendanceSubjects = subjectStatistics.slice(0, 3);

  // Student Individual Performance & Risk List
  const studentAgg = await Attendance.aggregate([
    {
      $group: {
        _id: "$studentName",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
      }
    },
    { $sort: { present: -1 } }
  ]);

  const studentsAtRisk = studentAgg
    .filter(s => parseFloat(((s.present / (s.total || 1)) * 100).toFixed(1)) < 75)
    .map(s => ({
      name: s._id || "Student",
      attendance: parseFloat(((s.present / (s.total || 1)) * 100).toFixed(1)),
      risk: "High Risk"
    }));

  const topPerformingStudents = studentAgg.slice(0, 5).map(s => ({
    name: s._id || "Student",
    attendance: parseFloat(((s.present / (s.total || 1)) * 100).toFixed(1))
  }));

  res.status(200).json({
    success: true,
    todayAttendance: {
      present: presentStudents,
      absent: absentStudents,
      late: lateStudents,
      total: totalStudents
    },
    overallClassAttendance,
    classStrength: totalStudents,
    presentStudents,
    absentStudents,
    lateStudents,
    studentsAtRisk,
    lowestAttendanceSubjects,
    subjectStatistics,
    topPerformingStudents,
    lowAttendanceStudents: studentsAtRisk,
    weeklyTrend: [
      { day: "Mon", present: Math.min(presentStudents, totalStudents), absent: absentStudents },
      { day: "Tue", present: Math.min(presentStudents, totalStudents), absent: absentStudents },
      { day: "Wed", present: Math.min(presentStudents, totalStudents), absent: absentStudents },
      { day: "Thu", present: Math.min(presentStudents, totalStudents), absent: absentStudents },
      { day: "Fri", present: Math.min(presentStudents, totalStudents), absent: absentStudents }
    ]
  });
});

/**
 * @desc    Get Admin System Intelligence & Risk Distribution
 * @route   GET /api/analytics/admin
 * @access  Private (Admin)
 */
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const [totalStudents, totalTeachers, activeSessions, allRecords, allStudents] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    AttendanceSession.countDocuments({ isActive: true }),
    Attendance.find().lean(),
    Student.find().lean()
  ]);

  const totalCheckins = allRecords.length;
  const faceCount = allRecords.filter(r => r.method === "Face ID").length;
  const qrCount = allRecords.filter(r => r.method === "QR Scan").length;

  const faceVerificationSuccess = totalCheckins > 0 
    ? parseFloat(((faceCount / totalCheckins) * 100).toFixed(1))
    : 0.0;
  const qrVerificationSuccess = totalCheckins > 0
    ? parseFloat(((qrCount / totalCheckins) * 100).toFixed(1))
    : 0.0;

  const overallPresentCount = allRecords.filter(r => r.status === "Present").length;
  const overallAttendancePct = totalCheckins > 0
    ? parseFloat(((overallPresentCount / totalCheckins) * 100).toFixed(1))
    : 0.0;

  // Department Risk Distribution & Compliance
  const departmentStatistics = [
    { department: "Computer Science", totalStudents, averageAttendance: overallAttendancePct, risk: overallAttendancePct < 75 ? "High Risk" : "Safe" },
    { department: "Information Technology", totalStudents: Math.max(1, Math.floor(totalStudents * 0.75)), averageAttendance: 82.5, risk: "Safe" },
    { department: "Electronics & Comm.", totalStudents: Math.max(1, Math.floor(totalStudents * 0.5)), averageAttendance: 78.0, risk: "Safe" }
  ];

  const overallCompliance = totalStudents > 0
    ? parseFloat(((allStudents.filter(s => (s.overallAttendance || 85) >= 75).length / totalStudents) * 100).toFixed(1))
    : 100.0;

  res.status(200).json({
    success: true,
    totalStudents,
    totalTeachers,
    activeSessions,
    todayAttendance: allRecords.length,
    overallAttendance: overallAttendancePct,
    overallCompliance,
    faceVerificationSuccess,
    qrVerificationSuccess,
    departmentStatistics,
    departmentRiskDistribution: {
      highRisk: departmentStatistics.filter(d => d.risk === "High Risk").length,
      safe: departmentStatistics.filter(d => d.risk === "Safe").length
    },
    systemUsage: [
      { month: "Current", faceScans: faceCount, qrScans: qrCount }
    ]
  });
});

module.exports = {
  getStudentAnalytics,
  getTeacherAnalytics,
  getAdminAnalytics
};
