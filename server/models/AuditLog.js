const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    adminName: {
      type: String,
      default: "System Admin"
    },
    action: {
      type: String,
      required: [true, "Action description is required"]
    },
    entityType: {
      type: String,
      enum: ["Student", "Teacher", "Subject", "Department", "Timetable", "Assignment", "Exam", "Notification", "User", "Session"],
      required: true
    },
    entityId: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

auditLogSchema.index({ admin: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
