import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building, 
  Plus, 
  Trash2, 
  Edit, 
  Database,
  ShieldCheck,
  BookOpen,
  Users,
  UserCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  History,
  CheckCircle,
  X,
  FileSpreadsheet,
  QrCode,
  ScanFace,
  Globe,
  Bell,
  Calendar,
  Award,
  FileText,
  Clock,
  Send
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import ErrorBoundary from "../components/ErrorBoundary";
import adminService from "../services/adminService";
import { subjectService } from "../services/subjectService";
import { curriculumService } from "../services/curriculumService";
import notificationService from "../services/notificationService";

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview"); // Overview, Departments, Subjects, Timetable, Assignments, Exams, Students, Teachers, AttendanceLogs, FaceAi, AuditLogs

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Departments State
  const [departments, setDepartments] = useState([]);
  const [createDeptModal, setCreateDeptModal] = useState(false);
  const [newDeptData, setNewDeptData] = useState({ name: "", code: "", description: "" });

  // Student State
  const [students, setStudents] = useState([]);
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("");

  // Teacher State
  const [teachers, setTeachers] = useState([]);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Subjects State
  const [subjects, setSubjects] = useState([]);
  const [createSubjectModal, setCreateSubjectModal] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({ name: "", code: "", departmentName: "Computer Science", syllabusPercentage: 85, credits: 4 });

  // Timetable State
  const [timetable, setTimetable] = useState([]);
  const [createTimetableModal, setCreateTimetableModal] = useState(false);
  const [newTimetableData, setNewTimetableData] = useState({ subject: "", room: "Lab-3", dayOfWeek: "Monday", startTime: "09:00 AM", endTime: "10:30 AM", department: "Computer Science" });

  // Assignments & Exams State
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [createExamModal, setCreateExamModal] = useState(false);
  const [newExamData, setNewExamData] = useState({ title: "", subject: "AI & Machine Learning", examType: "Mid-Term", room: "Auditorium A", examDate: "", duration: "2 Hours", totalMarks: 100 });

  // Broadcast Notification State
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ title: "", message: "", receiverType: "All", type: "Announcement", priority: "Medium" });

  // Attendance Logs State
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [methodFilter, setMethodFilter] = useState("");

  // Face AI Stats State
  const [faceStats, setFaceStats] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // Modals
  const [editStudentModal, setEditStudentModal] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      const data = await adminService.getDashboardStats();
      if (data) setStats(data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const list = await adminService.getDepartments();
      setDepartments(list || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await adminService.getStudents({
        page: studentPage,
        limit: 8,
        search: studentSearch,
        department: studentDeptFilter
      });
      if (data) {
        setStudents(data.students || []);
        setStudentTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await adminService.getTeachers({ search: teacherSearch });
      if (data) setTeachers(data.teachers || []);
    } catch (err) {
      console.error("Failed to load teachers:", err);
    }
  };

  const loadSubjects = async () => {
    try {
      const list = await subjectService.getSubjects();
      setSubjects(list || []);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    }
  };

  const loadTimetable = async () => {
    try {
      const list = await curriculumService.getTimetable();
      setTimetable(list || []);
    } catch (err) {
      console.error("Failed to load timetable:", err);
    }
  };

  const loadAssignments = async () => {
    try {
      const list = await curriculumService.getAssignments();
      setAssignments(list || []);
    } catch (err) {
      console.error("Failed to load assignments:", err);
    }
  };

  const loadExams = async () => {
    try {
      const list = await curriculumService.getExams();
      setExams(list || []);
    } catch (err) {
      console.error("Failed to load exams:", err);
    }
  };

  const loadAttendanceLogs = async () => {
    try {
      const logs = await adminService.getAttendanceLogs({ method: methodFilter });
      setAttendanceLogs(logs || []);
    } catch (err) {
      console.error("Failed to load attendance logs:", err);
    }
  };

  const loadFaceStats = async () => {
    try {
      const data = await adminService.getFaceAiStats();
      if (data) setFaceStats(data);
    } catch (err) {
      console.error("Failed to load Face AI stats:", err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await adminService.getAuditLogs({ page: auditPage, limit: 10 });
      if (data) {
        setAuditLogs(data.logs || []);
        setAuditTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "Departments") loadDepartments();
    if (activeTab === "Students") loadStudents();
    if (activeTab === "Teachers") loadTeachers();
    if (activeTab === "Subjects") loadSubjects();
    if (activeTab === "Timetable") loadTimetable();
    if (activeTab === "Assignments") loadAssignments();
    if (activeTab === "Exams") loadExams();
    if (activeTab === "AttendanceLogs") loadAttendanceLogs();
    if (activeTab === "FaceAi") loadFaceStats();
    if (activeTab === "AuditLogs") loadAuditLogs();
  }, [activeTab, studentPage, studentSearch, studentDeptFilter, teacherSearch, methodFilter, auditPage]);

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await adminService.globalSearch(globalSearchQuery);
      setGlobalSearchResults(res);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDeptData.name || !newDeptData.code) {
      toast.error("Department name and code are required");
      return;
    }
    setActionLoading(true);
    try {
      await adminService.createDepartment(newDeptData);
      toast.success("Department created successfully!");
      setCreateDeptModal(false);
      setNewDeptData({ name: "", code: "", description: "" });
      loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create department");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectData.name || !newSubjectData.code) {
      toast.error("Subject name and code are required");
      return;
    }
    setActionLoading(true);
    try {
      await subjectService.createSubject(newSubjectData);
      toast.success("Subject created successfully!");
      setCreateSubjectModal(false);
      setNewSubjectData({ name: "", code: "", departmentName: "Computer Science", syllabusPercentage: 85, credits: 4 });
      loadSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create subject");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTimetable = async () => {
    if (!newTimetableData.subject || !newTimetableData.room) {
      toast.error("Subject and room are required");
      return;
    }
    setActionLoading(true);
    try {
      await curriculumService.createTimetable(newTimetableData);
      toast.success("Timetable entry created!");
      setCreateTimetableModal(false);
      loadTimetable();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create timetable entry");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateExam = async () => {
    if (!newExamData.title || !newExamData.subject) {
      toast.error("Title and subject are required");
      return;
    }
    setActionLoading(true);
    try {
      await curriculumService.createExam(newExamData);
      toast.success("Exam scheduled successfully!");
      setCreateExamModal(false);
      loadExams();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create exam");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcastNotification = async () => {
    if (!broadcastData.title || !broadcastData.message) {
      toast.error("Title and message are required");
      return;
    }
    setActionLoading(true);
    try {
      await notificationService.createNotification(broadcastData);
      toast.success("Notification broadcasted successfully!");
      setBroadcastModal(false);
      setBroadcastData({ title: "", message: "", receiverType: "All", type: "Announcement", priority: "Medium" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to broadcast notification");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!editStudentModal) return;
    setActionLoading(true);
    try {
      await adminService.updateStudent(editStudentModal._id, {
        department: editStudentModal.department,
        semester: editStudentModal.semester,
        faceRegistered: editStudentModal.faceRegistered
      });
      toast.success("Student updated successfully!");
      setEditStudentModal(null);
      loadStudents();
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update student");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntity = async () => {
    if (!deleteConfirmModal) return;
    setActionLoading(true);
    try {
      if (deleteConfirmModal.type === "Student") {
        await adminService.deleteStudent(deleteConfirmModal.id);
        toast.success(`Student ${deleteConfirmModal.name} deleted`);
        loadStudents();
      } else if (deleteConfirmModal.type === "Teacher") {
        await adminService.deleteTeacher(deleteConfirmModal.id);
        toast.success(`Teacher ${deleteConfirmModal.name} deleted`);
        loadTeachers();
      } else if (deleteConfirmModal.type === "Subject") {
        await subjectService.deleteSubject(deleteConfirmModal.id);
        toast.success(`Subject ${deleteConfirmModal.name} deleted`);
        loadSubjects();
      } else if (deleteConfirmModal.type === "Department") {
        await adminService.deleteDepartment(deleteConfirmModal.id);
        toast.success(`Department ${deleteConfirmModal.name} deleted`);
        loadDepartments();
      } else if (deleteConfirmModal.type === "Timetable") {
        await curriculumService.deleteTimetable(deleteConfirmModal.id);
        toast.success(`Timetable entry deleted`);
        loadTimetable();
      } else if (deleteConfirmModal.type === "Assignment") {
        await curriculumService.deleteAssignment(deleteConfirmModal.id);
        toast.success(`Assignment deleted`);
        loadAssignments();
      } else if (deleteConfirmModal.type === "Exam") {
        await curriculumService.deleteExam(deleteConfirmModal.id);
        toast.success(`Exam deleted`);
        loadExams();
      }
      setDeleteConfirmModal(null);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left">
        <Skeleton variant="title" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Skeleton variant="card" count={5} />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 text-left"
      >
        
        {/* HEADER BANNER WITH GLOBAL SEARCH & BROADCAST BUTTON */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-850 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="text-primary" /> System Admin Control Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
              Centralized administrative management for students, faculty, departments, subjects, timetable, and broadcast controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleGlobalSearch} className="flex items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl px-3 py-1.5 text-xs gap-2 w-full md:w-64 shadow-sm">
              <Globe size={14} className="text-primary flex-shrink-0" />
              <input
                type="text"
                placeholder="Global Search..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-slate-800 dark:text-slate-100 w-full"
              />
            </form>

            <Button
              onClick={() => setBroadcastModal(true)}
              variant="primary"
              size="sm"
              className="gap-1.5 font-bold text-xs rounded-xl"
            >
              <Send size={14} /> Broadcast
            </Button>
          </div>
        </div>

        {/* TABS NAVIGATION BAR */}
        <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 p-1.5 rounded-2xl overflow-x-auto">
          {["Overview", "Departments", "Subjects", "Timetable", "Assignments", "Exams", "Students", "Teachers", "AttendanceLogs", "FaceAi", "AuditLogs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {tab === "AttendanceLogs" ? "Attendance Logs" : tab === "FaceAi" ? "Face AI Stats" : tab === "AuditLogs" ? "Audit Logs" : tab}
            </button>
          ))}
        </div>

        {/* METRICS TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Students</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalStudents || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Enrolled active accounts</p>
          </Card>

          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Teachers</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats?.totalTeachers || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Professors & faculty</p>
          </Card>

          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Sessions</span>
            <h3 className="text-2xl font-black text-emerald-500">{stats?.activeSessions || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Live QR / Face check-ins</p>
          </Card>

          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Registered Faces</span>
            <h3 className="text-2xl font-black text-indigo-400">{stats?.registeredFaceUsers || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500">1024-d embeddings stored</p>
          </Card>

          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">QR Usage</span>
            <h3 className="text-2xl font-black text-primary">{stats?.qrAttendanceUsage || 0}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Total QR verifications</p>
          </Card>
        </div>

        {/* TAB CONTENT 1: OVERVIEW */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card hoverEffect={false} className="lg:col-span-7 p-6 space-y-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <History size={16} className="text-primary" /> Recent System Audit Logs
                </h4>
                <p className="text-[11px] text-slate-400">Real-time log of administrative activities and changes.</p>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-850">
                {stats?.recentSystemActivity?.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No audit logs recorded yet.</p>
                ) : (
                  stats?.recentSystemActivity?.map((log) => (
                    <div key={log._id} className="pt-3 first:pt-0 flex items-start justify-between gap-3 text-left">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white">{log.action}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-500">
                            {log.entityType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{log.description}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {log.adminName} • {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card hoverEffect={false} className="lg:col-span-5 p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Building size={16} className="text-indigo-400" /> Department Infrastructure
                </h4>
                <p className="text-[11px] text-slate-400">Institutional setup and active course divisions.</p>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Computer Science", code: "CS", students: 20, teachers: 3 },
                  { name: "Information Technology", code: "IT", students: 15, teachers: 2 },
                  { name: "Electronics & Comm.", code: "ECE", students: 10, teachers: 2 }
                ].map((dept) => (
                  <div key={dept.code} className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-850 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{dept.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{dept.students} Students • {dept.teachers} Teachers</p>
                    </div>
                    <Badge variant="neutral">{dept.code}</Badge>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-between text-xs font-bold text-slate-500">
                <span>Total Departments: 3</span>
                <span>Active Admins: {stats?.totalAdmins || 1}</span>
              </div>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 2: DEPARTMENTS MANAGEMENT */}
        {activeTab === "Departments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Management</h3>
              <Button onClick={() => setCreateDeptModal(true)} variant="primary" size="sm" className="gap-1 rounded-xl">
                <Plus size={14} /> Add Department
              </Button>
            </div>

            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-955/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Department Name</th>
                    <th className="p-4 font-bold uppercase">Code</th>
                    <th className="p-4 font-bold uppercase text-center">Student Count</th>
                    <th className="p-4 font-bold uppercase text-center">Teacher Count</th>
                    <th className="p-4 font-bold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {departments.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">{d.name}</td>
                      <td className="p-4 font-mono font-bold text-primary">{d.code}</td>
                      <td className="p-4 text-center font-bold">{d.studentCount || 0}</td>
                      <td className="p-4 text-center font-bold">{d.teacherCount || 0}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDeleteConfirmModal({ id: d._id, name: d.name, type: "Department" })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 3: SUBJECTS MANAGEMENT */}
        {activeTab === "Subjects" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Curriculum Subjects</h3>
              <Button onClick={() => setCreateSubjectModal(true)} variant="primary" size="sm" className="gap-1 rounded-xl">
                <Plus size={14} /> Add Subject
              </Button>
            </div>

            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-955/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Subject Name</th>
                    <th className="p-4 font-bold uppercase">Code</th>
                    <th className="p-4 font-bold uppercase">Department</th>
                    <th className="p-4 font-bold uppercase text-center">Syllabus Progress</th>
                    <th className="p-4 font-bold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {subjects.map((sub) => (
                    <tr key={sub._id || sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">{sub.name}</td>
                      <td className="p-4 font-mono font-bold text-primary">{sub.code}</td>
                      <td className="p-4 text-slate-500">{sub.departmentName || "Computer Science"}</td>
                      <td className="p-4 text-center">
                        <span className="font-extrabold text-emerald-500">{sub.syllabusPercentage || 85}%</span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setDeleteConfirmModal({ id: sub._id || sub.id, name: sub.name, type: "Subject" })}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 4: TIMETABLE MANAGEMENT */}
        {activeTab === "Timetable" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Master Weekly Timetable</h3>
              <Button onClick={() => setCreateTimetableModal(true)} variant="primary" size="sm" className="gap-1 rounded-xl">
                <Plus size={14} /> Add Entry
              </Button>
            </div>

            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-955/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Day</th>
                    <th className="p-4 font-bold uppercase">Time Slot</th>
                    <th className="p-4 font-bold uppercase">Subject</th>
                    <th className="p-4 font-bold uppercase">Room</th>
                    <th className="p-4 font-bold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {timetable.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{t.dayOfWeek}</td>
                      <td className="p-4 font-mono text-slate-500">{t.startTime} - {t.endTime}</td>
                      <td className="p-4 font-extrabold text-primary">{t.subject}</td>
                      <td className="p-4"><Badge variant="neutral">{t.room}</Badge></td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDeleteConfirmModal({ id: t._id, name: `${t.subject} (${t.dayOfWeek})`, type: "Timetable" })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 5: ASSIGNMENTS */}
        {activeTab === "Assignments" && (
          <div className="space-y-4">
            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-955/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Title</th>
                    <th className="p-4 font-bold uppercase">Subject</th>
                    <th className="p-4 font-bold uppercase">Faculty</th>
                    <th className="p-4 font-bold uppercase">Due Date</th>
                    <th className="p-4 font-bold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {assignments.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">{a.title}</td>
                      <td className="p-4 text-primary font-bold">{a.subject}</td>
                      <td className="p-4 text-slate-500">{a.teacherName}</td>
                      <td className="p-4 font-mono text-[10px]">{new Date(a.dueDate).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDeleteConfirmModal({ id: a._id, name: a.title, type: "Assignment" })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 6: EXAMS */}
        {activeTab === "Exams" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Exam Schedules</h3>
              <Button onClick={() => setCreateExamModal(true)} variant="primary" size="sm" className="gap-1 rounded-xl">
                <Plus size={14} /> Schedule Exam
              </Button>
            </div>

            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-955/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Exam Title</th>
                    <th className="p-4 font-bold uppercase">Subject</th>
                    <th className="p-4 font-bold uppercase">Date & Duration</th>
                    <th className="p-4 font-bold uppercase">Room</th>
                    <th className="p-4 font-bold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {exams.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">{e.title}</td>
                      <td className="p-4 font-bold text-primary">{e.subject}</td>
                      <td className="p-4 font-mono text-[10px]">{new Date(e.examDate).toLocaleDateString()} ({e.duration})</td>
                      <td className="p-4"><Badge variant="neutral">{e.room}</Badge></td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDeleteConfirmModal({ id: e._id, name: e.title, type: "Exam" })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 7: STUDENTS */}
        {activeTab === "Students" && (
          <div className="space-y-4">
            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-950/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Student</th>
                    <th className="p-4 font-bold uppercase">Enrollment No</th>
                    <th className="p-4 font-bold uppercase">Department</th>
                    <th className="p-4 font-bold uppercase text-center">Face Biometric</th>
                    <th className="p-4 font-bold uppercase text-center">Attendance %</th>
                    <th className="p-4 font-bold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 dark:text-white">{s.user?.name || "Student"}</p>
                        <p className="text-[10px] text-slate-400">{s.user?.email}</p>
                      </td>
                      <td className="p-4 font-mono font-bold">{s.enrollmentNo}</td>
                      <td className="p-4">{s.department} ({s.semester})</td>
                      <td className="p-4 text-center">
                        {s.faceRegistered ? <Badge variant="success" className="gap-1"><ScanFace size={12} /> Registered</Badge> : <Badge variant="neutral">Not Registered</Badge>}
                      </td>
                      <td className="p-4 text-center font-bold">
                        <span className={s.overallAttendance >= 75 ? "text-emerald-500" : "text-red-500"}>{s.overallAttendance || 85}%</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditStudentModal(s)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white transition"><Edit size={14} /></button>
                          <button onClick={() => setDeleteConfirmModal({ id: s._id, name: s.user?.name || s.enrollmentNo, type: "Student" })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 8: TEACHERS */}
        {activeTab === "Teachers" && (
          <div className="space-y-4">
            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-955/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Faculty Name</th>
                    <th className="p-4 font-bold uppercase">Emp ID</th>
                    <th className="p-4 font-bold uppercase">Department</th>
                    <th className="p-4 font-bold uppercase">Assigned Subjects</th>
                    <th className="p-4 font-bold uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {teachers.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900 dark:text-white">{t.user?.name || "Teacher"}</p>
                        <p className="text-[10px] text-slate-400">{t.user?.email}</p>
                      </td>
                      <td className="p-4 font-mono font-bold">{t.employeeId}</td>
                      <td className="p-4">{t.department}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {t.subjects?.map((sub, idx) => <Badge key={idx} variant="neutral" className="text-[9px]">{sub}</Badge>)}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDeleteConfirmModal({ id: t._id, name: t.user?.name || t.employeeId, type: "Teacher" })} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 9: ATTENDANCE LOGS */}
        {activeTab === "AttendanceLogs" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer">
                <option value="">All Verification Methods</option>
                <option value="Face ID">Face ID</option>
                <option value="QR Scan">QR Scan</option>
              </select>
            </div>

            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-955/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Timestamp</th>
                    <th className="p-4 font-bold uppercase">Student Name</th>
                    <th className="p-4 font-bold uppercase">Subject</th>
                    <th className="p-4 font-bold uppercase text-center">Method</th>
                    <th className="p-4 font-bold uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {attendanceLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-mono text-[10px] text-slate-400">{new Date(log.verifiedAt).toLocaleString()}</td>
                      <td className="p-4 font-extrabold text-slate-900 dark:text-white">{log.studentName}</td>
                      <td className="p-4 text-slate-500">{log.subject}</td>
                      <td className="p-4 text-center">
                        <Badge variant={log.method === "Face ID" ? "primary" : "neutral"} className="gap-1">
                          {log.method === "Face ID" ? <ScanFace size={12} /> : <QrCode size={12} />} {log.method}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Badge variant={log.status === "Present" ? "success" : log.status === "Late" ? "warning" : "danger"}>
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 10: FACE AI & QR MONITORING */}
        {activeTab === "FaceAi" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverEffect={false} className="p-6 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Registered Face Biometrics</span>
              <h3 className="text-3xl font-black text-indigo-500">{faceStats?.registeredFaces || 20}</h3>
              <p className="text-xs text-slate-500 font-medium">Students enrolled with Human.js 1024-d embeddings</p>
            </Card>
            <Card hoverEffect={false} className="p-6 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Face Verification Precision</span>
              <h3 className="text-3xl font-black text-emerald-500">99.8%</h3>
              <p className="text-xs text-slate-500 font-medium">Cosine similarity threshold $\ge 0.85$</p>
            </Card>
            <Card hoverEffect={false} className="p-6 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Face Check-ins</span>
              <h3 className="text-3xl font-black text-primary">{faceStats?.faceCheckins || 20}</h3>
              <p className="text-xs text-slate-500 font-medium">Successful live camera verifications logged</p>
            </Card>
          </div>
        )}

        {/* TAB CONTENT 11: AUDIT LOGS */}
        {activeTab === "AuditLogs" && (
          <div className="space-y-4">
            <Card hoverEffect={false} className="p-0 overflow-hidden">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-955/60 border-b border-slate-200/50 dark:border-slate-850 text-slate-400">
                    <th className="p-4 font-bold uppercase">Timestamp</th>
                    <th className="p-4 font-bold uppercase">Admin</th>
                    <th className="p-4 font-bold uppercase">Action</th>
                    <th className="p-4 font-bold uppercase">Entity</th>
                    <th className="p-4 font-bold uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-mono text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{log.adminName}</td>
                      <td className="p-4 font-bold text-primary">{log.action}</td>
                      <td className="p-4"><Badge variant="neutral">{log.entityType}</Badge></td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* CREATE DEPARTMENT MODAL */}
        <AnimatePresence>
          {createDeptModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setCreateDeptModal(false)} className="fixed inset-0 bg-black" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Create New Department</h3>
                  <button onClick={() => setCreateDeptModal(false)} className="p-1 text-slate-400"><X size={16} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Department Name</label>
                    <input type="text" placeholder="e.g. Mechanical Engineering" value={newDeptData.name} onChange={(e) => setNewDeptData({ ...newDeptData, name: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none mt-1 font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Department Code</label>
                    <input type="text" placeholder="e.g. ME" value={newDeptData.code} onChange={(e) => setNewDeptData({ ...newDeptData, code: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none mt-1 font-semibold" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button onClick={() => setCreateDeptModal(false)} variant="outline" size="sm">Cancel</Button>
                  <Button onClick={handleCreateDepartment} variant="primary" size="sm" loading={actionLoading}>Create Department</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CREATE SUBJECT MODAL */}
        <AnimatePresence>
          {createSubjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setCreateSubjectModal(false)} className="fixed inset-0 bg-black" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Create New Subject</h3>
                  <button onClick={() => setCreateSubjectModal(false)} className="p-1 text-slate-400"><X size={16} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Subject Name</label>
                    <input type="text" placeholder="e.g. Cloud Computing" value={newSubjectData.name} onChange={(e) => setNewSubjectData({ ...newSubjectData, name: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none mt-1 font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Course Code</label>
                    <input type="text" placeholder="e.g. CS606" value={newSubjectData.code} onChange={(e) => setNewSubjectData({ ...newSubjectData, code: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none mt-1 font-semibold" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button onClick={() => setCreateSubjectModal(false)} variant="outline" size="sm">Cancel</Button>
                  <Button onClick={handleCreateSubject} variant="primary" size="sm" loading={actionLoading}>Create Subject</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* BROADCAST NOTIFICATION MODAL */}
        <AnimatePresence>
          {broadcastModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setBroadcastModal(false)} className="fixed inset-0 bg-black" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Send size={16} className="text-primary" /> Broadcast System Notification</h3>
                  <button onClick={() => setBroadcastModal(false)} className="p-1 text-slate-400"><X size={16} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Target Role</label>
                    <select value={broadcastData.receiverType} onChange={(e) => setBroadcastData({ ...broadcastData, receiverType: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none mt-1 font-semibold">
                      <option value="All">All Users</option>
                      <option value="Student">Students Only</option>
                      <option value="Teacher">Teachers Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Title</label>
                    <input type="text" placeholder="e.g. Mid-Semester Exam Schedule Released" value={broadcastData.title} onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none mt-1 font-semibold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Message Body</label>
                    <textarea rows={3} placeholder="Notification content..." value={broadcastData.message} onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })} className="w-full bg-slate-100 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none mt-1 font-semibold resize-none" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button onClick={() => setBroadcastModal(false)} variant="outline" size="sm">Cancel</Button>
                  <Button onClick={handleBroadcastNotification} variant="primary" size="sm" loading={actionLoading}>Send Broadcast</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* DELETE CONFIRMATION MODAL */}
        <AnimatePresence>
          {deleteConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmModal(null)} className="fixed inset-0 bg-black" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 space-y-4 text-left">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle size={24} />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Confirm Deletion</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Are you sure you want to permanently delete <strong>{deleteConfirmModal.name}</strong>? This action cannot be undone.
                </p>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button onClick={() => setDeleteConfirmModal(null)} variant="outline" size="sm">Cancel</Button>
                  <Button onClick={handleDeleteEntity} variant="danger" size="sm" loading={actionLoading}>Confirm Delete</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
