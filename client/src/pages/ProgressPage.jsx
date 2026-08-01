import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Award, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { analyticsService } from "../services/analyticsService";
import ErrorBoundary from "../components/ErrorBoundary";

export const ProgressPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await analyticsService.getStudentAnalytics();
        setData(res);
      } catch (err) {
        console.error("Failed to load progress analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" />
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  const badges = [
    { id: "b1", title: "Early Bird", desc: "Arrived within 5 minutes of session start 10 times.", icon: "🌅", unlocked: true },
    { id: "b2", title: "Perfect Month", desc: "Maintained 100% attendance in the month of June.", icon: "🏆", unlocked: true },
    { id: "b3", title: "Biometric Veteran", desc: "Registered and verified Face ID parameters.", icon: "⚡", unlocked: true },
    { id: "b4", title: "Subject Master", desc: "Reached 90%+ attendance in AI & Machine Learning.", icon: "🤖", unlocked: false }
  ];

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
        className="space-y-8 text-left"
      >
        
        {/* HEADER PAGE */}
        <motion.div variants={itemVariants} className="border-b border-slate-205 dark:border-slate-850 pb-5">
          <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
            <TrendingUp className="text-primary" /> Progress compliance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
            Review your academic compliance levels, earn badges, and resolve AI warnings.
          </p>
        </motion.div>

        {/* AI RECOMMENDATIONS CONTAINER */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500 flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" /> AI Attendance Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.aiRecommendations.map((rec) => (
              <Card 
                key={rec.id}
                hoverEffect={true} 
                className={`border-l-4 ${
                  rec.severity === "danger" 
                    ? "border-l-red-500 bg-red-500/5 dark:bg-red-500/10 border-slate-200/50 dark:border-slate-850" 
                    : rec.severity === "warning"
                    ? "border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border-slate-200/50 dark:border-slate-850"
                    : "border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border-slate-200/50 dark:border-slate-850"
                } p-6 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-450 dark:text-slate-500">{rec.subject}</span>
                    <Badge variant={rec.severity === "danger" ? "danger" : rec.severity === "warning" ? "warning" : "success"}>
                      {rec.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-705 dark:text-slate-350 leading-relaxed font-medium">
                    {rec.message}
                  </p>
                </div>

                {rec.actionLink && (
                  <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-850/50 flex justify-end">
                    <Button 
                      onClick={() => navigate(rec.actionLink)}
                      variant="ghost" 
                      size="sm" 
                      className="p-0 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-transparent"
                    >
                      Verify Session <ArrowRight size={12} className="ml-1" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SUBJECT WISE ATTENDANCE COMPLIANCE CHART */}
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Subject-wise Compliance</h3>
            
            <Card hoverEffect={false} className="p-6 space-y-6">
              {data?.subjectAttendance.map((sub, i) => {
                const isCompliant = sub.percentage >= 75;
                return (
                  <div key={i} className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs flex-wrap gap-2">
                      <div className="space-y-0.5 text-left">
                        <p className="font-extrabold text-slate-900 dark:text-white">{sub.subject}</p>
                        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500">{sub.code} • {sub.faculty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold font-mono text-sm ${isCompliant ? "text-emerald-500" : "text-danger"}`}>
                          {sub.percentage}%
                        </span>
                        <Badge variant={isCompliant ? "success" : "danger"}>
                          {isCompliant ? "Compliant" : "Deficit"}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.percentage}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className={`h-2 rounded-full ${
                          isCompliant 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                            : "bg-gradient-to-r from-red-500 to-amber-500"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          </motion.div>

          {/* ACHIEVEMENTS & BADGES COLUMN */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500 flex items-center gap-1.5">
              <Award size={16} className="text-amber-500" /> Academic Badges
            </h3>
            
            <Card hoverEffect={false} className="p-5 space-y-5">
              {badges.map((badge) => (
                <div 
                  key={badge.id} 
                  className={`flex items-start gap-4 text-left ${
                    !badge.unlocked ? "opacity-40" : ""
                  }`}
                >
                  <div className={`h-11 w-11 rounded-2xl bg-white dark:bg-slate-900 border flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${
                    badge.unlocked ? "border-amber-500/20 dark:border-amber-500/10 shadow-amber-500/5 glow-accent" : "border-slate-200 dark:border-slate-800"
                  }`}>
                    {badge.icon}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-950 dark:text-white">{badge.title}</p>
                      <Badge variant={badge.unlocked ? "success" : "neutral"} className="text-[8px] font-bold">
                        {badge.unlocked ? "Unlocked" : "Locked"}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-450 leading-relaxed">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>
          
        </div>
        
      </motion.div>
    </ErrorBoundary>
  );
};

export default ProgressPage;
