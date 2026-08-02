import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Upload
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { studentService } from "../services/studentService";
import { curriculumService } from "../services/curriculumService";
import { weeklyTimetable } from "../data/dummyData";
import ErrorBoundary from "../components/ErrorBoundary";

export const SmartCurriculum = () => {
  const [curriculum, setCurriculum] = useState(null);
  const [timetableMap, setTimetableMap] = useState({});
  const [activeTab, setActiveTab] = useState("Timetable"); // Timetable, Subjects, Assignments, Exams
  const [activeDay, setActiveDay] = useState("Monday"); // for Timetable day select
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const loadData = async () => {
    try {
      const [res, timetableList] = await Promise.all([
        studentService.getCurriculum(),
        curriculumService.getTimetable()
      ]);

      setCurriculum(res);

      // Group timetable entries by dayOfWeek
      const grouped = {};
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].forEach(day => {
        grouped[day] = timetableList
          .filter(t => t.dayOfWeek === day)
          .map(t => ({
            room: t.room,
            subject: t.subject,
            time: `${t.startTime} - ${t.endTime}`,
            faculty: t.teacherName || "Faculty Member"
          }));
      });

      setTimetableMap(grouped);
    } catch (err) {
      toast.error("Failed to load curriculum details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignmentSubmit = async (assignmentId) => {
    setSubmittingId(assignmentId);
    try {
      const res = await studentService.submitAssignment(assignmentId);
      if (res.success) {
        toast.success("Assignment submitted successfully!");
        loadData(); // Reload list to show submitted status
      }
    } catch (err) {
      toast.error("Submit failed.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <ErrorBoundary>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left"
      >
        {/* HEADER BANNER */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-205 dark:border-slate-850 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
              <BookOpen className="text-primary" /> Smart Curriculum
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
              Track syllabus, class timetables, upcoming examinations, and submit assignments.
            </p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 p-1 rounded-xl max-w-full overflow-x-auto">
            {["Timetable", "Subjects", "Assignments", "Exams"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeTab === tab
                    ? "bg-white dark:bg-slate-800/80 text-primary dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
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
              {/* Day selector row */}
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer border transition-all ${
                      activeDay === day
                        ? "bg-primary text-white border-primary glow-primary shadow-sm shadow-primary/20"
                        : "bg-white dark:bg-slate-955 border-slate-200/60 dark:border-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Timetable card grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(timetableMap[activeDay]?.length ? timetableMap[activeDay] : weeklyTimetable[activeDay])?.map((slot, index) => (
                  <Card key={index} hoverEffect={true} className="flex flex-col justify-between p-5 min-h-[140px]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">Lecture {index + 1}</span>
                        <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-400/5 dark:bg-red-400/10 border border-red-500/10 px-2 py-0.5 rounded-full">
                          <MapPin size={10} /> {slot.room}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-950 dark:text-white leading-snug">{slot.subject}</h4>
                    </div>
                    <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {slot.time}</span>
                      <span className="flex items-center gap-1"><User size={12} /> {slot.faculty?.split(' ').pop()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* 2. SUBJECTS TAB */}
          {activeTab === "Subjects" && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
            >
              {curriculum?.subjects.map((sub, i) => (
                <Card key={i} hoverEffect={true} className="p-5 flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{sub.subject}</h4>
                        <Badge variant="accent">{sub.code}</Badge>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400">{sub.faculty}</p>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Syllabus Completion</span>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-2.5 mt-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-450">
                      <span>Units Completed</span>
                      <span className="font-bold text-slate-950 dark:text-white">{sub.syllabus}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.syllabus}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" 
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {/* 3. ASSIGNMENTS TAB */}
          {activeTab === "Assignments" && (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-left"
            >
              {curriculum?.assignments.map((asg) => (
                <Card key={asg.id} hoverEffect={true} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{asg.title}</h4>
                      <Badge variant={asg.status === "Submitted" ? "success" : "warning"}>{asg.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-450 flex-wrap">
                      <span className="flex items-center gap-1"><BookOpen size={12} /> {asg.subject}</span>
                      <span className="text-slate-300 dark:text-slate-800">•</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> Due: {asg.due}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {asg.status === "Submitted" ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[9px] text-slate-450 uppercase font-bold tracking-wider">Evaluation Grade</p>
                          <p className="text-xs font-extrabold text-slate-850 dark:text-slate-100">{asg.grade !== "-" ? `Grade: ${asg.grade}` : "Pending Review"}</p>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-inner">
                          <CheckCircle size={16} />
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleAssignmentSubmit(asg.id)}
                        loading={submittingId === asg.id}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 font-bold text-xs rounded-xl"
                      >
                        <Upload size={14} /> Upload PDF
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {/* 4. EXAMS TAB */}
          {activeTab === "Exams" && (
            <motion.div
              key="exams"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
            >
              {curriculum?.exams.map((ex) => (
                <Card key={ex.id} hoverEffect={true} className="p-5 flex flex-col justify-between min-h-[160px]">
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-primary">{ex.title}</span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{ex.subject}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                      Syllabus Coverage: <strong className="font-semibold text-slate-700 dark:text-slate-300">{ex.portion}</strong>
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px] font-bold text-slate-450 dark:text-slate-400 flex-wrap gap-2">
                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {ex.date}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {ex.time}</span>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

        </AnimatePresence>

        {/* MERN ROUTING NOTE */}
        <motion.div variants={itemVariants} className="p-4 bg-slate-100 dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl">
          <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-250 flex items-center gap-1.5">
            <BookOpen size={12} className="text-primary" /> MERN Future Integration Details:
          </h5>
          <p className="text-[9px] text-slate-550 dark:text-slate-400 leading-relaxed mt-1">
            `studentService.js` maps PDF files to storage buckets (using Cloudinary or AWS S3 upload streams). When implementing Express backend APIs, map these tab panels to `/api/curriculum` and `/api/assignments/upload` with Multer middleware handles.
          </p>
        </motion.div>
        
      </motion.div>
    </ErrorBoundary>
  );
};

export default SmartCurriculum;
