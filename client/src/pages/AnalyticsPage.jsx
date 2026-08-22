import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  ShieldCheck,
  Zap,
  Target
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { analyticsService } from "../services/analyticsService";
import ErrorBoundary from "../components/ErrorBoundary";

const COLORS = ["#22C55E", "#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6"];

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semester");
  const [exporting, setExporting] = useState(false);

  const loadAnalytics = async () => {
    try {
      const res = await analyticsService.getStudentAnalytics();
      setData(res);
    } catch (err) {
      console.error("Failed to load analytics data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Attendify - Official Student Attendance Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Overall Attendance Rate: ${data?.overallAttendance || 85}%`, 14, 30);
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 36);

      const tableData = (data?.subjectWiseAttendance || []).map(s => [
        s.subject,
        s.total,
        s.present,
        s.absent,
        s.late,
        `${s.percentage}%`
      ]);

      autoTable(doc, {
        startY: 44,
        head: [["Subject", "Total Classes", "Present", "Absent", "Late", "Attendance %"]],
        body: tableData,
        theme: "striped"
      });

      doc.save(`Attendify_Attendance_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Attendance PDF Report generated successfully!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF report.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const exportData = (data?.subjectWiseAttendance || []).map(s => ({
        "Subject": s.subject,
        "Total Classes": s.total,
        "Present Days": s.present,
        "Absent Days": s.absent,
        "Late Days": s.late,
        "Attendance Rate (%)": s.percentage
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Analytics");
      XLSX.writeFile(workbook, `Attendify_Attendance_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Attendance Excel Report exported!");
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Failed to export Excel spreadsheet.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left">
        <Skeleton variant="title" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" count={3} />
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Present", value: data?.presentCount || 62 },
    { name: "Absent", value: data?.absentCount || 8 },
    { name: "Late", value: data?.lateCount || 2 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900/95 border border-slate-800 rounded-xl text-left text-[11px] font-bold text-white shadow-2xl backdrop-blur-sm">
          <p className="border-b border-slate-800 pb-1.5 mb-1.5 font-extrabold text-slate-400">{label}</p>
          {payload.map((item, idx) => (
            <p key={idx} className="flex items-center gap-2 mt-0.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-slate-300">{item.name}:</span>
              <span>{item.value} {item.unit || "%"}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 text-left"
      >
        
        {/* HEADER BANNER WITH FILTERS & EXPORT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-850 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
              <BarChart3 className="text-primary" /> AI Analytics & Intelligence Console
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
              Real-time MongoDB aggregated metrics, AI risk scores, forecast models, and personalized academic guidance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              loading={exporting}
              className="gap-1.5 font-bold text-xs rounded-xl"
            >
              <FileText size={14} className="text-red-500" /> Export PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              loading={exporting}
              className="gap-1.5 font-bold text-xs rounded-xl"
            >
              <FileSpreadsheet size={14} className="text-emerald-500" /> Export Excel
            </Button>
          </div>
        </div>

        {/* AI RISK ENGINE & FORECAST BANNER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* RISK SCORE TILE */}
          <Card hoverEffect={false} className="lg:col-span-4 p-6 space-y-4 flex flex-col justify-between border-primary/30">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1">
                <Sparkles size={12} /> AI Risk Assessment Engine
              </span>
              <div className="flex items-baseline justify-between pt-2">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{data?.riskScore || 88}<span className="text-sm font-bold text-slate-400">/100</span></h3>
                <Badge variant={data?.riskLevel === "Safe" ? "success" : data?.riskLevel === "Warning" ? "warning" : "danger"}>
                  {data?.riskLevel || "Safe"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed pt-1">
                {data?.explanation || "Excellent attendance record. You are safely compliant."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-850 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400">Personalized AI Recommendation</span>
              {data?.recommendations?.map((rec, idx) => (
                <p key={idx} className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Zap size={14} className="flex-shrink-0" /> {rec}
                </p>
              ))}
            </div>
          </Card>

          {/* ATTENDANCE FORECAST MODEL */}
          <Card hoverEffect={false} className="lg:col-span-8 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Target size={16} className="text-indigo-400" /> Attendance Forecast Model
              </h4>
              <p className="text-[11px] text-slate-400">Dynamic projection based on upcoming class participation scenarios.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-2">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Next 5 Classes Projection</p>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-500 font-bold">Best Case: {data?.attendanceForecast?.next5?.bestCase}%</span>
                  <span className="text-red-500 font-bold">Worst Case: {data?.attendanceForecast?.next5?.worstCase}%</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-2">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">Next 10 Classes Projection</p>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-500 font-bold">Best Case: {data?.attendanceForecast?.next10?.bestCase}%</span>
                  <span className="text-red-500 font-bold">Worst Case: {data?.attendanceForecast?.next10?.worstCase}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-850">
              <span>Required for 75%: {data?.requiredClassesToReach75 || 0} classes</span>
              <span>Safe Misses: {data?.safeMisses || 0} lectures</span>
            </div>
          </Card>

        </div>

        {/* CHARTS GRID ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* PIE CHART */}
          <Card hoverEffect={false} className="lg:col-span-4 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award size={16} className="text-emerald-500" /> Attendance Ratio Split
              </h4>
              <p className="text-[11px] text-slate-400">Present vs Absent vs Late check-in distribution.</p>
            </div>

            <div className="h-56 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{data?.overallAttendance}%</span>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Rate</p>
              </div>
            </div>

            <div className="flex justify-around text-xs font-bold text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-850">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Present ({data?.presentCount})</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Absent ({data?.absentCount})</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Late ({data?.lateCount})</span>
            </div>
          </Card>

          {/* BAR CHART: SUBJECT-WISE ATTENDANCE */}
          <Card hoverEffect={false} className="lg:col-span-8 p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 size={16} className="text-primary" /> Subject Risk & Attendance Ranking
              </h4>
              <p className="text-[11px] text-slate-400">Comparing attendance performance across course subjects.</p>
            </div>
            <div className="h-64 w-full text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.subjectWiseAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.08} vertical={false} />
                  <XAxis dataKey="subject" stroke="#94a3b8" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "8px" }} />
                  <Bar dataKey="percentage" name="Attendance %" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>

      </motion.div>
    </ErrorBoundary>
  );
};

export default AnalyticsPage;
