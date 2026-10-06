import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Target,
  BookOpen,
  Info,
  Clock,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { analyticsService } from "../services/analyticsService";
import { studentService } from "../services/studentService";
import ErrorBoundary from "../components/ErrorBoundary";

export const ProgressPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, profileRes] = await Promise.all([
          analyticsService.getStudentAnalytics(),
          studentService.getProfile()
        ]);

        setData(analyticsRes || {});
        setProfile(profileRes || {});
      } catch (err) {
        console.error("Failed to load progress data:", err);
        setData({});
        setProfile({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper formula: calculate required consecutive classes to reach 75%
  const calculateClassesNeeded = (present, total, targetPct = 75) => {
    if (!total || total === 0) return 0;
    const currentPct = (present / total) * 100;
    if (currentPct >= targetPct) return 0;
    
    const targetDecimal = targetPct / 100;
    const needed = Math.ceil((targetDecimal * total - present) / (1 - targetDecimal));
    return needed > 0 ? needed : 0;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto text-left">
        <Skeleton variant="title" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton variant="card" count={4} />
        </div>
        <Skeleton variant="card" count={2} />
      </div>
    );
  }

  const overallPct = data?.overallAttendance ?? 0;
  const totalClasses = data?.totalClasses ?? 0;
  const presentCount = data?.presentCount ?? 0;
  const absentCount = data?.absentCount ?? 0;
  const lateCount = data?.lateCount ?? 0;
  const req75 = data?.requiredClassesToReach75 ?? calculateClassesNeeded(presentCount + lateCount * 0.5, totalClasses, 75);

  const subjectAttendance = Array.isArray(data?.subjectWiseAttendance)
    ? data.subjectWiseAttendance
    : Array.isArray(data?.subjectAttendance)
      ? data.subjectAttendance
      : [];

  const formattedSubjects = subjectAttendance.map((sub, index) => {
    const total = Number(sub.total || sub.totalClasses || 0);
    const present = Number(sub.present || sub.presentCount || 0);
    const late = Number(sub.late || sub.lateCount || 0);
    const effectivePresent = present + late * 0.5;

    let percentage = Number(sub.percentage);
    if (!Number.isFinite(percentage)) {
      percentage = total > 0 ? parseFloat(((effectivePresent / total) * 100).toFixed(1)) : 0;
    }

    const faculty = sub.faculty && sub.faculty !== "N/A: Faculty Member" && sub.faculty !== "Faculty Member"
      ? sub.faculty
      : "Faculty information unavailable";

    const neededTo75 = calculateClassesNeeded(effectivePresent, total, 75);

    return {
      id: sub._id || sub.id || `subject-${index}`,
      subject: sub.subject || sub._id || "Subject Module",
      faculty,
      percentage: Math.min(100, Math.max(0, percentage)),
      total,
      present,
      absent: Number(sub.absent || sub.absentCount || 0),
      late,
      neededTo75
    };
  });

  // Sort subjects to determine lowest & highest performing subjects
  const sortedSubjects = [...formattedSubjects].sort((a, b) => a.percentage - b.percentage);
  const lowestSubject = sortedSubjects[0] || null;
  const highestSubject = sortedSubjects[sortedSubjects.length - 1] || null;

  // Real Badge Calculations
  const isFaceEnrolled = profile?.faceRegistered || data?.faceRegistered || false;
  
  const badges = [
    {
      id: "b1",
      title: "Early Bird",
      desc: presentCount >= 5 ? "Unlocked — Verified early/on-time attendance in 5+ sessions." : `Locked — Verify early/on-time attendance in 5 sessions (${presentCount}/5).`,
      icon: "🌅",
      unlocked: presentCount >= 5,
      progressText: presentCount >= 5 ? "100%" : `${presentCount}/5`
    },
    {
      id: "b2",
      title: "Perfect Month",
      desc: absentCount === 0 && totalClasses >= 5 ? "Unlocked — Maintained 100% attendance this month." : `Locked — Maintain 100% attendance for a full month (${absentCount} missed).`,
      icon: "🏆",
      unlocked: absentCount === 0 && totalClasses >= 5,
      progressText: absentCount === 0 ? "100%" : `${absentCount} Missed`
    },
    {
      id: "b3",
      title: "Biometric Veteran",
      desc: isFaceEnrolled ? "Unlocked — Face verification active and enrolled." : "Locked — Complete face registration in Profile.",
      icon: "🛡️",
      unlocked: isFaceEnrolled,
      progressText: isFaceEnrolled ? "Enrolled" : "Not Enrolled"
    },
    {
      id: "b4",
      title: "Subject Master",
      desc: highestSubject && highestSubject.percentage >= 90
        ? `Unlocked — Reached 90%+ attendance in ${highestSubject.subject}.`
        : `Locked — Reach 90% attendance in any subject (Highest: ${highestSubject ? highestSubject.percentage : 0}% / 90%).`,
      icon: "🎓",
      unlocked: highestSubject ? highestSubject.percentage >= 90 : false,
      progressText: highestSubject ? `${highestSubject.percentage}% / 90%` : "0%"
    }
  ];

  // Dynamic Next Goal Calculation
  let nextGoalText = "Maintain your current attendance compliance.";
  if (lowestSubject && lowestSubject.percentage < 75) {
    nextGoalText = `Reach 75% attendance in ${lowestSubject.subject}.`;
  } else if (!isFaceEnrolled) {
    nextGoalText = "Complete face verification registration.";
  } else if (highestSubject && highestSubject.percentage < 90) {
    nextGoalText = `Reach 90% attendance in ${highestSubject.subject} to unlock Subject Master.`;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <ErrorBoundary>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left max-w-6xl mx-auto"
      >

        {/* HEADER PAGE */}
        <motion.div variants={itemVariants} className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="text-primary" size={24} /> Progress Compliance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
            Track your attendance progress, subject compliance, and academic goals.
          </p>
        </motion.div>

        {/* 1. OVERALL PROGRESS SUMMARY ROW */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card hoverEffect={false} className="p-4.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{overallPct}%</p>
              <Badge variant={overallPct >= 75 ? "success" : overallPct >= 60 ? "warning" : "danger"} className="text-[10px]">
                {overallPct >= 75 ? "Compliant" : overallPct >= 60 ? "At Risk" : "Critical"}
              </Badge>
            </div>
          </Card>

          <Card hoverEffect={false} className="p-4.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance Status</span>
            <div className="flex items-baseline justify-between">
              <p className={`text-base font-black capitalize ${overallPct >= 75 ? "text-emerald-500" : overallPct >= 60 ? "text-amber-500" : "text-red-500"}`}>
                {overallPct >= 75 ? "Compliant" : overallPct >= 60 ? "At Risk" : "Shortage"}
              </p>
              <span className="text-[10px] text-slate-400 font-bold">Target 75%</span>
            </div>
          </Card>

          <Card hoverEffect={false} className="p-4.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classes Attended</span>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-emerald-500">{presentCount}</p>
              <span className="text-[10px] font-bold text-slate-400">of {totalClasses}</span>
            </div>
          </Card>

          <Card hoverEffect={false} className="p-4.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classes Missed</span>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-red-500">{absentCount}</p>
              <span className="text-[10px] font-bold text-slate-400">Lectures</span>
            </div>
          </Card>
        </motion.div>

        {/* 2. ATTENDANCE COMPLIANCE GOAL CARD */}
        <motion.div variants={itemVariants}>
          <Card hoverEffect={false} className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target size={16} className="text-primary" /> Attendance Compliance Goal
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  University requirement: 75% minimum attendance rate.
                </p>
              </div>
              <Badge variant={overallPct >= 75 ? "success" : overallPct >= 60 ? "warning" : "danger"} className="self-start sm:self-auto px-3 py-1 font-bold">
                {overallPct >= 75 ? "COMPLIANT" : overallPct >= 60 ? "AT RISK" : "CRITICAL SHORTAGE"}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Current: {overallPct}%</span>
                <span className="text-slate-400">Required: 75%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden shadow-inner relative">
                {/* 75% Target Line Indicator */}
                <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-amber-500 z-10 opacity-70" title="75% Target Threshold" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, overallPct)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-3 rounded-full ${
                    overallPct >= 75
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : overallPct >= 60
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : "bg-gradient-to-r from-red-500 to-amber-500"
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-semibold">
              {overallPct >= 75 ? (
                <span className="text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> Attendance requirement achieved. You are safely compliant.
                </span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1.5">
                  <AlertTriangle size={15} /> Attend the next <strong>{req75}</strong> consecutive classes to reach 75% requirement.
                </span>
              )}
            </div>
          </Card>
        </motion.div>

        {/* 3. PROGRESS INSIGHTS */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Info size={15} className="text-primary" /> Progress Insights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <Card hoverEffect={false} className="p-4 flex items-start gap-3 bg-slate-50/50 dark:bg-slate-950/40">
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Overall Standing</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {overallPct >= 75
                    ? `Your overall attendance (${overallPct}%) is safely above the required 75% threshold.`
                    : `Your overall attendance (${overallPct}%) is below the 75% threshold. Regular attendance is required.`}
                </p>
              </div>
            </Card>

            <Card hoverEffect={false} className="p-4 flex items-start gap-3 bg-slate-50/50 dark:bg-slate-950/40">
              <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Subject Attention Focus</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {lowestSubject
                    ? `${lowestSubject.subject} is currently your lowest-attendance subject (${lowestSubject.percentage}%).`
                    : "All subjects are currently monitored and compliant."}
                </p>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* 4. MAIN GRID: SUBJECT COMPLIANCE + BADGES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT: SUBJECT-WISE COMPLIANCE */}
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Subject-wise Compliance
            </h3>

            <Card hoverEffect={false} className="p-6 space-y-6">
              {formattedSubjects.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    More attendance records are required to calculate your progress.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Subject progress will update automatically as attendance is verified.
                  </p>
                </div>
              ) : (
                formattedSubjects.map((sub, i) => {
                  const isCompliant = sub.percentage >= 75;
                  const isRisk = sub.percentage >= 60 && sub.percentage < 75;

                  return (
                    <div key={sub.id} className="space-y-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/60 last:border-none last:pb-0">
                      
                      <div className="flex justify-between items-start text-xs flex-wrap gap-2">
                        <div className="space-y-0.5 text-left">
                          <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {sub.subject}
                          </p>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Faculty: <span className="font-semibold text-slate-700 dark:text-slate-300">{sub.faculty}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-mono text-sm ${isCompliant ? "text-emerald-500" : isRisk ? "text-amber-500" : "text-red-500"}`}>
                            {sub.percentage}%
                          </span>
                          <Badge variant={isCompliant ? "success" : isRisk ? "warning" : "danger"} className="text-[10px] font-bold">
                            {isCompliant ? "Compliant" : isRisk ? "At Risk" : "Critical"}
                          </Badge>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${sub.percentage}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className={`h-2 rounded-full ${
                            isCompliant
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                              : isRisk
                                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                : "bg-gradient-to-r from-red-500 to-amber-500"
                          }`}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>Attended: {sub.present} of {sub.total} classes</span>
                        {sub.neededTo75 > 0 ? (
                          <span className="text-amber-500 font-bold">Attend next {sub.neededTo75} class{sub.neededTo75 > 1 ? "es" : ""} to reach 75%</span>
                        ) : (
                          <span className="text-emerald-500 font-bold">Attendance is on track</span>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </Card>
          </motion.div>

          {/* RIGHT: WHAT TO FOCUS ON, YOUR NEXT GOAL & ACADEMIC BADGES */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
            
            {/* WHAT TO FOCUS ON */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-500" /> What to Focus On
              </h3>
              <Card hoverEffect={false} className="p-5 space-y-2 border-amber-500/20">
                {lowestSubject ? (
                  <>
                    <div className="flex items-baseline justify-between">
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">{lowestSubject.subject}</p>
                      <span className={`font-bold text-xs ${lowestSubject.percentage < 75 ? "text-amber-500" : "text-emerald-500"}`}>
                        {lowestSubject.percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {lowestSubject.percentage < 75
                        ? `Prioritize upcoming ${lowestSubject.subject} classes to reach 75% compliance.`
                        : "All subjects are currently on track."}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">No subject attendance records found.</p>
                )}
              </Card>
            </div>

            {/* YOUR NEXT GOAL */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Target size={15} className="text-primary" /> Your Next Goal
              </h3>
              <Card hoverEffect={false} className="p-5 space-y-2">
                <p className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                  <span>Next Milestone</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                  {nextGoalText}
                </p>
              </Card>
            </div>

            {/* ACADEMIC BADGES */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Award size={15} className="text-amber-500" /> Academic Achievements
              </h3>

              <Card hoverEffect={false} className="p-5 space-y-4">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex items-start gap-3.5 text-left transition ${
                      !badge.unlocked ? "opacity-60" : ""
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-xs border ${
                        badge.unlocked
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                          : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      {badge.icon}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {badge.title}
                        </p>
                        <Badge
                          variant={badge.unlocked ? "success" : "neutral"}
                          className="text-[9px] font-bold flex-shrink-0 px-2 py-0.5"
                        >
                          {badge.unlocked ? "Unlocked" : badge.progressText}
                        </Badge>
                      </div>

                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>

          </motion.div>

        </div>

      </motion.div>
    </ErrorBoundary>
  );
};

export default ProgressPage;