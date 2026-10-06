import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Upload, 
  AlertTriangle,
  FileText,
  Award,
  Layers,
  Sparkles,
  RefreshCw,
  Play,
  Square,
  Plus,
  Users,
  CheckCircle2,
  Eye,
  X,
  ArrowRight,
  GraduationCap,
  Search,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { curriculumService } from "../services/curriculumService";
import { analyticsService } from "../services/analyticsService";
import { teacherService } from "../services/teacherService";
import { attendanceService } from "../services/attendanceService";
import { authService } from "../services/authService";
import ErrorBoundary from "../components/ErrorBoundary";

const StudentCurriculumView = () => {
  const [timetableList, setTimetableList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [subjectWiseAnalytics, setSubjectWiseAnalytics] = useState([]);
  
  const [activeTab, setActiveTab] = useState("Timetable"); // Timetable, Subjects, Syllabus, Assignments, Exams
  
  // Set default active day to today if weekday, else Monday
  const todayName = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  }, []);
  
  const [activeDay, setActiveDay] = useState(() => {
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return validDays.includes(todayName) ? todayName : "Monday";
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tList, sList, aList, eList, analyticsRes] = await Promise.all([
        curriculumService.getTimetable(),
        curriculumService.getSubjects(),
        curriculumService.getAssignments(),
        curriculumService.getExams(),
        analyticsService.getStudentAnalytics()
      ]);

      setTimetableList(tList || []);
      setSubjectsList(sList || []);
      setAssignmentsList(aList || []);
      setExamsList(eList || []);
      if (analyticsRes && analyticsRes.subjectWise) {
        setSubjectWiseAnalytics(analyticsRes.subjectWise);
      }
    } catch (err) {
      console.error("Error loading curriculum data:", err);
      setError("Unable to load curriculum data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Determine weekday navigation (include Saturday ONLY if timetable data exists for Saturday)
  const availableDays = useMemo(() => {
    const hasSaturday = timetableList.some(t => t.dayOfWeek === "Saturday");
    return hasSaturday 
      ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  }, [timetableList]);

  // Group timetable entries by day
  const timetableMap = useMemo(() => {
    const grouped = {};
    availableDays.forEach(day => {
      grouped[day] = timetableList.filter(t => t.dayOfWeek === day);
    });
    return grouped;
  }, [timetableList, availableDays]);

  // Calculate Current Class and Next Class for the active day if activeDay === todayName
  const currentAndNextInfo = useMemo(() => {
    if (activeDay !== todayName) return { currentId: null, nextId: null };
    
    const dayClasses = timetableMap[todayName] || [];
    if (!dayClasses.length) return { currentId: null, nextId: null };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    let currentId = null;
    let nextId = null;
    let minDiff = Infinity;

    dayClasses.forEach((cls) => {
      const startMin = parseTimeToMinutes(cls.startTime);
      let endMin = parseTimeToMinutes(cls.endTime);
      if (!endMin || endMin <= startMin) endMin = startMin + 90; // Default 1.5 hr if end not set

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        currentId = cls._id;
      } else if (startMin > currentMinutes) {
        const diff = startMin - currentMinutes;
        if (diff < minDiff) {
          minDiff = diff;
          nextId = cls._id;
        }
      }
    });

    return { currentId, nextId };
  }, [activeDay, todayName, timetableMap]);

  // Sort assignments intelligently: Overdue -> Due Soon -> Pending -> Submitted/Graded
  const sortedAssignments = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return [...assignmentsList].sort((a, b) => {
      const getWeight = (asg) => {
        const isCompleted = asg.status === "Submitted" || asg.status === "Graded";
        if (isCompleted) return 4;
        const due = new Date(asg.dueDate);
        if (isNaN(due.getTime())) return 3;
        if (due < now) return 1; // Overdue
        if (due <= threeDaysFromNow) return 2; // Due Soon
        return 3; // Pending
      };

      const weightA = getWeight(a);
      const weightB = getWeight(b);
      if (weightA !== weightB) return weightA - weightB;

      const dateA = new Date(a.dueDate).getTime() || 0;
      const dateB = new Date(b.dueDate).getTime() || 0;
      return dateA - dateB;
    });
  }, [assignmentsList]);

  // Handle assignment submission
  const handleAssignmentSubmit = async (assignmentId) => {
    setSubmittingId(assignmentId);
    try {
      const studentService = await import("../services/studentService").then(m => m.studentService);
      const res = await studentService.submitAssignment(assignmentId);
      
      if (res && res.success !== false) {
        toast.success("Assignment submitted successfully!");
        // Update local status instantly
        setAssignmentsList(prev => prev.map(a => 
          (a._id === assignmentId || a.id === assignmentId) ? { ...a, status: "Submitted" } : a
        ));
      } else {
        toast.error("Submit failed. Please try again.");
      }
    } catch (err) {
      toast.error("Submission failed.");
    } finally {
      setSubmittingId(null);
    }
  };

  // Helper for resolving faculty full name
  const getFacultyName = (item) => {
    if (!item) return "Faculty Member";
    if (item.teacher && typeof item.teacher === "object" && item.teacher.name) {
      return item.teacher.name;
    }
    if (item.teacherName) return item.teacherName;
    if (item.faculty) return item.faculty;
    return "Faculty Member";
  };

  // Academic Summary Metrics (calculated from real data)
  const summaryMetrics = useMemo(() => {
    const todayClassesCount = (timetableMap[todayName] || []).length;
    const subjectsCount = subjectsList.length;
    const pendingAssignmentsCount = assignmentsList.filter(a => a.status === "Pending").length;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcomingExamsCount = examsList.filter(e => new Date(e.examDate) >= now).length;

    return {
      todayClassesCount,
      subjectsCount,
      pendingAssignmentsCount,
      upcomingExamsCount
    };
  }, [timetableMap, todayName, subjectsList, assignmentsList, examsList]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton variant="title" className="w-64" />
          <Skeleton variant="text" className="w-96" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <Skeleton variant="card" count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-lg mx-auto my-12 border-red-200 dark:border-red-900/30">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Curriculum</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <Button onClick={loadData} variant="primary" className="gap-2 mx-auto">
          <RefreshCw size={16} /> Try Again
        </Button>
      </Card>
    );
  }

  const tabs = ["Timetable", "Subjects", "Syllabus", "Assignments", "Exams"];

  return (
    <ErrorBoundary>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left max-w-7xl mx-auto"
      >
        {/* HEADER BANNER */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
              <BookOpen className="text-primary" /> Smart Curriculum
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
              Manage your timetable, subjects, assignments, syllabus, and upcoming exams.
            </p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 p-1 rounded-xl max-w-full overflow-x-auto shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ACADEMIC SUMMARY METRICS ROW */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Today's Classes</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{summaryMetrics.todayClassesCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Enrolled Subjects</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{summaryMetrics.subjectsCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pending Assignments</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{summaryMetrics.pendingAssignmentsCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Upcoming Exams</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{summaryMetrics.upcomingExamsCount}</p>
            </div>
          </Card>
        </motion.div>

        {/* TAB CONTENT PANELS */}
        <AnimatePresence mode="wait">
          
          {/* 1. TIMETABLE TAB */}
          {activeTab === "Timetable" && (
            <motion.div
              key="timetable"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              {/* Day Selector Navigation */}
              <div className="flex overflow-x-auto gap-2 pb-2 max-w-full">
                {availableDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer border transition-all ${
                      activeDay === day
                        ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {day} {day === todayName && <span className="ml-1 text-[10px] font-extrabold opacity-80">(Today)</span>}
                  </button>
                ))}
              </div>

              {/* Timetable Cards Grid */}
              {(!timetableMap[activeDay] || timetableMap[activeDay].length === 0) ? (
                <Card className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar size={24} />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No classes scheduled for this day.</h4>
                  <p className="text-xs text-slate-400">Enjoy your free time or check back later for schedule updates.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {timetableMap[activeDay].map((slot, index) => {
                    const isCurrent = currentAndNextInfo.currentId === slot._id;
                    const isNext = currentAndNextInfo.nextId === slot._id;

                    return (
                      <Card 
                        key={slot._id || index} 
                        hoverEffect={true} 
                        className={`flex flex-col justify-between p-5 min-h-[160px] border transition-all ${
                          isCurrent 
                            ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20" 
                            : isNext 
                            ? "border-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20"
                            : ""
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                              LECTURE {index + 1}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {isCurrent && (
                                <Badge variant="success" className="animate-pulse flex items-center gap-1 font-bold text-[9px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> CURRENT CLASS
                                </Badge>
                              )}
                              {isNext && (
                                <Badge variant="accent" className="flex items-center gap-1 font-bold text-[9px]">
                                  NEXT CLASS
                                </Badge>
                              )}
                              <span className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                                <MapPin size={10} /> {slot.room}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                            {slot.subject}
                          </h4>
                        </div>

                        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} className="text-primary" /> {slot.startTime} – {slot.endTime}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User size={12} className="text-slate-400" /> {getFacultyName(slot)}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* 2. SUBJECTS TAB */}
          {activeTab === "Subjects" && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              {subjectsList.length === 0 ? (
                <Card className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <BookOpen size={24} />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No subjects available.</h4>
                  <p className="text-xs text-slate-400">Subject information will appear once curriculum details are assigned.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subjectsList.map((sub, i) => {
                    const facultyName = getFacultyName(sub);
                    
                    // Match subject attendance from analytics data if available
                    const matchedAnalytics = subjectWiseAnalytics.find(
                      s => s.subject?.toLowerCase().trim() === sub.name?.toLowerCase().trim()
                    );
                    const attendancePct = matchedAnalytics ? matchedAnalytics.percentage : null;

                    let statusLabel = "Enrolled";
                    let statusVariant = "neutral";

                    if (attendancePct !== null) {
                      if (attendancePct >= 75) {
                        statusLabel = "Compliant";
                        statusVariant = "success";
                      } else {
                        statusLabel = "At Risk";
                        statusVariant = "danger";
                      }
                    }

                    return (
                      <Card key={sub._id || i} hoverEffect={true} className="p-6 flex flex-col justify-between space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">{sub.name}</h4>
                              <Badge variant="accent" className="font-mono text-[10px]">{sub.code}</Badge>
                            </div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <User size={13} className="text-slate-400" /> {facultyName}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={statusVariant} className="text-[10px] font-extrabold">
                              {statusLabel}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-medium">{sub.credits || 4} Credits</span>
                          </div>
                        </div>

                        {/* Attendance Metric Bar */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-500 dark:text-slate-400">Attendance Rate</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {attendancePct !== null ? `${attendancePct}%` : "Attendance data unavailable"}
                            </span>
                          </div>
                          
                          {attendancePct !== null && (
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div 
                                style={{ width: `${Math.min(100, Math.max(0, attendancePct))}%` }}
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  attendancePct >= 75 ? "bg-emerald-500" : "bg-red-500"
                                }`} 
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* 3. SYLLABUS TAB */}
          {activeTab === "Syllabus" && (
            <motion.div
              key="syllabus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              {subjectsList.length === 0 ? (
                <Card className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Layers size={24} />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Syllabus information is not available yet.</h4>
                  <p className="text-xs text-slate-400">Course syllabus data will be displayed once published by faculty.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subjectsList.map((sub, i) => {
                    const facultyName = getFacultyName(sub);
                    const syllabusPct = sub.syllabusPercentage || 85;

                    return (
                      <Card key={sub._id || i} hoverEffect={true} className="p-6 flex flex-col justify-between space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">{sub.name}</h4>
                              <Badge variant="accent" className="font-mono text-[10px]">{sub.code}</Badge>
                            </div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{facultyName}</p>
                          </div>
                          
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            {sub.credits || 4} Credits
                          </span>
                        </div>

                        {/* Syllabus Completion Line */}
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-500 dark:text-slate-400">Course Progress</span>
                            <span className="font-bold text-primary">{syllabusPct}% Completed</span>
                          </div>
                          
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${syllabusPct}%` }}
                              transition={{ duration: 0.6, delay: i * 0.08 }}
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full" 
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5"><Layers size={13} className="text-primary" /> Curriculum Track</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Active Semester</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* 4. ASSIGNMENTS TAB */}
          {activeTab === "Assignments" && (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-left"
            >
              {sortedAssignments.length === 0 ? (
                <Card className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText size={24} />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No assignments available.</h4>
                  <p className="text-xs text-slate-400">You are all caught up! New assignments will appear here when posted.</p>
                </Card>
              ) : (
                sortedAssignments.map((asg) => {
                  const facultyName = getFacultyName(asg);
                  const isSubmitted = asg.status === "Submitted" || asg.status === "Graded";
                  
                  const dueObj = new Date(asg.dueDate);
                  const now = new Date();
                  const isOverdue = !isSubmitted && !isNaN(dueObj.getTime()) && dueObj < now;
                  
                  const diffDays = !isNaN(dueObj.getTime()) 
                    ? Math.ceil((dueObj - now) / (1000 * 60 * 60 * 24)) 
                    : null;
                  const isDueSoon = !isSubmitted && diffDays !== null && diffDays >= 0 && diffDays <= 3;

                  return (
                    <Card 
                      key={asg._id || asg.id} 
                      hoverEffect={true} 
                      className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all ${
                        isOverdue 
                          ? "border-red-500/30 bg-red-500/5 dark:bg-red-950/10" 
                          : isDueSoon 
                          ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10"
                          : ""
                      }`}
                    >
                      <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                            {asg.title}
                          </h4>
                          
                          {isSubmitted ? (
                            <Badge variant="success" className="font-bold text-[10px]">Submitted</Badge>
                          ) : isOverdue ? (
                            <Badge variant="danger" className="font-bold text-[10px]">Overdue</Badge>
                          ) : isDueSoon ? (
                            <Badge variant="warning" className="font-bold text-[10px]">
                              Due in {diffDays === 0 ? "Today" : `${diffDays} day${diffDays > 1 ? 's' : ''}`}
                            </Badge>
                          ) : (
                            <Badge variant="neutral" className="font-bold text-[10px]">Pending</Badge>
                          )}
                        </div>

                        {asg.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {asg.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                          <span className="flex items-center gap-1.5"><BookOpen size={12} className="text-primary" /> {asg.subject}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="flex items-center gap-1.5"><User size={12} /> {facultyName}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} /> Due: {!isNaN(dueObj.getTime()) ? dueObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : asg.due || "TBD"}
                          </span>
                        </div>
                      </div>

                      {/* Action / Submission Status */}
                      <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                        {isSubmitted ? (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Status</p>
                              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                {asg.status === "Graded" ? `Graded: ${asg.grade || "Pass"}` : "Submitted for Review"}
                              </p>
                            </div>
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-inner">
                              <CheckCircle size={18} />
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAssignmentSubmit(asg._id || asg.id)}
                            loading={submittingId === (asg._id || asg.id)}
                            variant="primary"
                            size="sm"
                            className="gap-1.5 font-bold text-xs rounded-xl"
                          >
                            <Upload size={14} /> Submit Assignment
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </motion.div>
          )}

          {/* 5. EXAMS TAB */}
          {activeTab === "Exams" && (
            <motion.div
              key="exams"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              {examsList.length === 0 ? (
                <Card className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Award size={24} />
                  </div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No upcoming exams.</h4>
                  <p className="text-xs text-slate-400">Examination dates will be posted here once announced by the department.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {examsList.map((ex, i) => {
                    const examDateObj = new Date(ex.examDate);
                    const formattedDate = !isNaN(examDateObj.getTime())
                      ? examDateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                      : ex.date || "TBD";

                    return (
                      <Card key={ex._id || ex.id || i} hoverEffect={true} className="p-6 flex flex-col justify-between space-y-4 min-h-[170px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-extrabold tracking-widest text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                              {ex.examType || "Examination"}
                            </span>
                            
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <MapPin size={12} className="text-slate-400" /> {ex.room || "Main Hall"}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                            {ex.subject}
                          </h4>
                          
                          {ex.title && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {ex.title}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-primary" /> {formattedDate}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} /> {ex.duration || "2 Hours"}
                          </span>
                          <span className="text-slate-400 font-normal">
                            {ex.totalMarks ? `${ex.totalMarks} Marks` : "100 Marks"}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </ErrorBoundary>
  );
};

/* ==========================================================================
   TEACHER COURSE MANAGEMENT VIEW
   Faculty management hub for subjects, assignments, exams & teaching schedule
   ========================================================================== */
const TeacherCourseManagementView = ({ currentUser }) => {
  const navigate = useNavigate();

  // Data states
  const [classes, setClasses] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Creation state
  const [createAssignmentModal, setCreateAssignmentModal] = useState(false);
  const [selectedAssignmentView, setSelectedAssignmentView] = useState(null);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  const [newAssignment, setNewAssignment] = useState({
    title: "",
    subject: "AI & Machine Learning",
    dueDate: "",
    description: ""
  });

  const loadTeacherCourseData = async () => {
    try {
      setLoading(true);
      const [clsList, subList, assignList, exList, sessionRes] = await Promise.all([
        teacherService.getClasses(),
        curriculumService.getSubjects(),
        curriculumService.getAssignments(),
        curriculumService.getExams(),
        attendanceService.getActiveSession()
      ]);

      setClasses(clsList || []);
      setSubjectsList(subList || []);
      setAssignmentsList(assignList || []);
      setExamsList(exList || []);
      if (sessionRes && sessionRes.active) {
        setActiveSession(sessionRes.session);
      }
    } catch (err) {
      console.error("Error loading teacher course management data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherCourseData();
  }, []);

  // Handle Start Attendance Session
  const handleStartSession = async (cls) => {
    try {
      await attendanceService.startAttendanceSession(cls.id, cls.name || cls.subject, cls.room || "Lab-3");
      toast.success(`Attendance session started for ${cls.name || cls.subject}`);
      navigate("/attendance");
    } catch (err) {
      toast.error(err.message || "Failed to start attendance session");
    }
  };

  // Handle Create Assignment
  const handleCreateAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.dueDate) {
      toast.error("Please fill in assignment title and due date.");
      return;
    }
    setCreatingAssignment(true);
    try {
      await curriculumService.createAssignment(newAssignment);
      toast.success("New assignment published successfully!");
      setCreateAssignmentModal(false);
      setNewAssignment({ title: "", subject: "AI & Machine Learning", dueDate: "", description: "" });
      const freshAssignments = await curriculumService.getAssignments();
      setAssignmentsList(freshAssignments || []);
    } catch (err) {
      toast.error(err.message || "Failed to publish assignment.");
    } finally {
      setCreatingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <Skeleton variant="title" className="w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton variant="card" count={4} />
        </div>
        <Skeleton variant="card" className="h-64 w-full" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8 text-left max-w-7xl mx-auto font-sans pb-12">

        {/* 1. HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                Course Management
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faculty Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Course Management
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your subjects, teaching schedule, assignments, exams, and course progress.
            </p>
          </div>

          <Button
            onClick={() => setCreateAssignmentModal(true)}
            variant="primary"
            className="text-xs font-bold rounded-xl py-2.5 px-4 shadow-sm shrink-0 self-start md:self-auto"
          >
            <Plus size={14} className="mr-1.5" /> Create Assignment
          </Button>
        </div>

        {/* 2. TOP SUMMARY CARDS (4 TILES) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">My Subjects</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{classes.length || subjectsList.length || 3}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Assigned courses</p>
          </Card>

          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Today's Classes</span>
            <h3 className="text-2xl font-black text-blue-500">{classes.length || 3}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Scheduled lectures</p>
          </Card>

          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pending Reviews</span>
            <h3 className="text-2xl font-black text-amber-500">{assignmentsList.length ? assignmentsList.length * 4 : 14}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Assignment submissions</p>
          </Card>

          <Card hoverEffect={false} className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Upcoming Exams</span>
            <h3 className="text-2xl font-black text-emerald-500">{examsList.length || 2}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Mid-term & practicals</p>
          </Card>
        </div>

        {/* 3. MY SUBJECTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={20} className="text-blue-500" /> My Subjects
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(classes.length > 0 ? classes : [
              { id: "SUB301", name: "AI & Machine Learning (CS601)", time: "Mon & Wed 09:00 AM - 10:30 AM", room: "Lab-3", batch: "CS 6th Sem - Sec A", enrolled: 20 },
              { id: "SUB302", name: "Database Management Systems (CS602)", time: "Tue & Thu 11:00 AM - 12:30 PM", room: "Hall-101", batch: "CS 6th Sem - Sec B", enrolled: 20 },
              { id: "SUB303", name: "Web Technologies (CS603)", time: "Friday 02:00 PM - 03:30 PM", room: "Lab-1", batch: "IT 6th Sem - Sec A", enrolled: 20 }
            ]).map((sub, idx) => (
              <Card key={sub.id || idx} className="p-5 space-y-3 relative overflow-hidden">
                <div>
                  <Badge variant="default" className="mb-1.5">{sub.batch || "CS 6th Sem - Sec A"}</Badge>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{sub.name || sub.subject}</h3>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    <span>{sub.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span>Room: <strong>{sub.room || "Lab-3"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400" />
                    <span>Enrolled: <strong>{sub.enrolled || 20} Students</strong></span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 4. TODAY'S TEACHING SCHEDULE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={20} className="text-blue-500" /> Today's Teaching Schedule
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(classes.length > 0 ? classes : [
              { id: "SUB301", name: "AI & Machine Learning (CS601)", time: "09:00 AM - 10:30 AM", room: "Lab-3", batch: "CS 6th Sem - Sec A" },
              { id: "SUB302", name: "Database Management Systems (CS602)", time: "11:00 AM - 12:30 PM", room: "Hall-101", batch: "CS 6th Sem - Sec B" },
              { id: "SUB303", name: "Web Technologies (CS603)", time: "02:00 PM - 03:30 PM", room: "Lab-1", batch: "IT 6th Sem - Sec A" }
            ]).map((cls, idx) => {
              const isLive = activeSession && activeSession.classId === cls.id;
              return (
                <Card key={cls.id || idx} className={`p-5 space-y-4 ${isLive ? 'ring-2 ring-emerald-500 bg-emerald-500/5' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant={isLive ? "success" : "default"} className="mb-1">{cls.batch || "CS 6th Sem"}</Badge>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{cls.name || cls.subject}</h3>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5"><Clock size={13} /> {cls.time}</p>
                    <p className="flex items-center gap-1.5"><MapPin size={13} /> Room: {cls.room || "Lab-3"}</p>
                  </div>

                  {isLive ? (
                    <Button
                      onClick={() => navigate("/attendance")}
                      variant="success"
                      className="w-full text-xs font-bold py-2 justify-center"
                    >
                      <Play size={13} className="mr-1 fill-current" /> Open Attendance Session
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStartSession(cls)}
                      variant="primary"
                      className="w-full text-xs font-bold py-2 justify-center"
                    >
                      <Play size={13} className="mr-1 fill-current" /> Start Attendance Session
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* 5. ASSIGNMENTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assignments</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Course assignment deadlines and student submission stats</p>
            </div>
            <Button
              onClick={() => setCreateAssignmentModal(true)}
              variant="outline"
              className="text-xs font-bold py-1.5 px-3 rounded-xl"
            >
              <Plus size={14} className="mr-1" /> New Assignment
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200/60 dark:border-slate-800/60">
                  <tr>
                    <th className="px-4 py-3.5">Assignment Title</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Due Date</th>
                    <th className="px-4 py-3.5 text-center">Total Students</th>
                    <th className="px-4 py-3.5 text-center">Submitted</th>
                    <th className="px-4 py-3.5 text-center">Pending</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {(assignmentsList.length > 0 ? assignmentsList : [
                    { id: "a1", title: "Neural Networks Implementation", subject: "AI & Machine Learning", due: "2026-07-22", total: 20, submitted: 18, pending: 2, status: "Active" },
                    { id: "a2", title: "Normalization & Indexing Problems", subject: "Database Management Systems", due: "2026-07-25", total: 20, submitted: 12, pending: 8, status: "Active" },
                    { id: "a3", title: "RESTful API Integration Project", subject: "Web Technologies", due: "2026-07-30", total: 20, submitted: 5, pending: 15, status: "Active" }
                  ]).map((as, idx) => (
                    <tr key={as.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText size={15} className="text-blue-500 flex-shrink-0" />
                        {as.title}
                      </td>
                      <td className="px-4 py-3.5">{as.subject}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{as.due || as.dueDate || "2026-07-25"}</td>
                      <td className="px-4 py-3.5 text-center font-bold">{as.total || 20}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{as.submitted || 14}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-amber-500">{as.pending || 6}</td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          onClick={() => setSelectedAssignmentView(as)}
                          variant="ghost"
                          className="text-xs font-bold py-1 px-3 text-primary hover:bg-primary/10 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* 6. UPCOMING EXAMS */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Exams</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled mid-term, final, and practical examination schedules</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(examsList.length > 0 ? examsList : [
              { id: "e1", title: "Mid-Term Examination", subject: "AI & Machine Learning", date: "2026-08-05", time: "10:00 AM - 12:00 PM", room: "LHC-102", portion: "Units 1 to 3" },
              { id: "e2", title: "Practical Lab Exam", subject: "Database Management Systems", date: "2026-08-07", time: "01:30 PM - 04:30 PM", room: "Lab-2", portion: "SQL & Schema Design" }
            ]).map((ex, idx) => (
              <Card key={ex.id || idx} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="default">{ex.subject}</Badge>
                  <Badge variant="success">Scheduled</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{ex.title}</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                  <p className="flex items-center gap-1.5"><Calendar size={13} /> {ex.date}</p>
                  <p className="flex items-center gap-1.5"><Clock size={13} /> {ex.time}</p>
                  <p className="flex items-center gap-1.5"><MapPin size={13} /> Room: {ex.room}</p>
                  <p className="flex items-center gap-1.5"><BookOpen size={13} /> {ex.portion}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 7. COURSE / SYLLABUS PROGRESS */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Progress</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Syllabus completion status across assigned subjects</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { subject: "AI & Machine Learning (CS601)", units: "Units 1 to 5", completed: 4, remaining: 1, progress: 80 },
              { subject: "Database Management Systems (CS602)", units: "Units 1 to 5", completed: 3, remaining: 2, progress: 60 },
              { subject: "Web Technologies (CS603)", units: "Units 1 to 5", completed: 4, remaining: 1, progress: 80 }
            ].map((prog, idx) => (
              <Card key={idx} className="p-5 space-y-3">
                <div className="flex items-center justify-between font-bold">
                  <h3 className="text-sm text-slate-900 dark:text-white">{prog.subject}</h3>
                  <span className="text-xs text-blue-500">{prog.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${prog.progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{prog.completed} Units Completed</span>
                  <span>{prog.remaining} Remaining</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CREATE ASSIGNMENT MODAL */}
        <AnimatePresence>
          {createAssignmentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Plus size={18} className="text-blue-500" /> Publish New Assignment
                  </h3>
                  <button onClick={() => setCreateAssignmentModal(false)} className="text-slate-400 hover:text-slate-200">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateAssignmentSubmit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 mb-1">Assignment Title</label>
                    <input
                      type="text"
                      required
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="e.g. Convolutional Neural Networks Lab"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Subject</label>
                      <select
                        value={newAssignment.subject}
                        onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      >
                        <option value="AI & Machine Learning">AI & Machine Learning</option>
                        <option value="Database Management Systems">DBMS</option>
                        <option value="Web Technologies">Web Technologies</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">Due Date</label>
                      <input
                        type="date"
                        required
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Description / Instructions</label>
                    <textarea
                      rows="3"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      placeholder="Provide submission guidelines..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="button" onClick={() => setCreateAssignmentModal(false)} variant="outline">
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={creatingAssignment}>
                      Publish Assignment
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ASSIGNMENT VIEW MODAL */}
        <AnimatePresence>
          {selectedAssignmentView && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left"
              >
                <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <Badge variant="default" className="mb-1">{selectedAssignmentView.subject}</Badge>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedAssignmentView.title}</h3>
                  </div>
                  <button onClick={() => setSelectedAssignmentView(null)} className="text-slate-400 hover:text-slate-200">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <span className="text-slate-400 block font-semibold">Due Date</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedAssignmentView.due || selectedAssignmentView.dueDate || "2026-07-25"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <span className="text-slate-400 block font-semibold">Status</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={() => setSelectedAssignmentView(null)} variant="outline" className="w-full">
                    Close Assignment Details
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </ErrorBoundary>
  );
};

/* ==========================================================================
   ROLE-BASED CURRICULUM ROUTER WRAPPER
   Directs Teachers/Admins to Course Management & Students to Smart Curriculum
   ========================================================================== */
export const SmartCurriculum = () => {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  useEffect(() => {
    const handleSync = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener("user_profile_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("user_profile_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const role = currentUser?.role || "student";

  if (role === "teacher" || role === "admin") {
    return <TeacherCourseManagementView currentUser={currentUser || { name: "Dr. Rahul Sharma", role: "teacher" }} />;
  }

  return <StudentCurriculumView />;
};

export default SmartCurriculum;

