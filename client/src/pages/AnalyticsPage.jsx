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
  Line
} from "recharts";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Skeleton from "../components/Skeleton";
import { analyticsService } from "../services/analyticsService";
import ErrorBoundary from "../components/ErrorBoundary";

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("Semester"); // Month, Semester, Year

  useEffect(() => {
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
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="chart" count={2} />
        </div>
      </div>
    );
  }

  // Prediction line data (past 6 weeks + mock forecast for next 4 weeks)
  const predictionData = [
    { week: "Wk 1", actual: 72, target: 75, forecast: null },
    { week: "Wk 2", actual: 74, target: 75, forecast: null },
    { week: "Wk 3", actual: 71, target: 75, forecast: null },
    { week: "Wk 4", actual: 75, target: 75, forecast: null },
    { week: "Wk 5", actual: 77, target: 75, forecast: null },
    { week: "Wk 6", actual: 78.4, target: 75, forecast: 78.4 },
    { week: "Wk 7 (F)", actual: null, target: 75, forecast: 80.2 },
    { week: "Wk 8 (F)", actual: null, target: 75, forecast: 81.5 },
    { week: "Wk 9 (F)", actual: null, target: 75, forecast: 83.1 },
    { week: "Wk 10 (F)", actual: null, target: 75, forecast: 84.8 }
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

  // Custom tooltips configuration
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900/90 dark:bg-slate-950/95 border border-slate-800 rounded-xl text-left text-[11px] font-bold text-white shadow-2xl backdrop-blur-sm">
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
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left"
      >
        
        {/* HEADER BANNER */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-205 dark:border-slate-850 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
              <BarChart3 className="text-primary" /> Visual Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
              Analyze historical check-ins, subject splits, forecast trends, and review heatmaps.
            </p>
          </div>

          {/* Timeframe Select */}
          <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 p-1 rounded-xl max-w-full">
            {["Month", "Semester", "Year"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  timeframe === tf
                    ? "bg-white dark:bg-slate-800/80 text-primary dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </motion.div>

        {/* CHART ROW 1 */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* AREA CHART: ATTENDANCE TREND OVER MONTHS */}
          <Card hoverEffect={false} className="p-6 space-y-6">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-955 dark:text-white flex items-center gap-1.5">
                <TrendingUp size={16} className="text-primary" /> Monthly Attendance Trend
              </h4>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium">Shows overall percentage changes month by month.</p>
            </div>
            <div className="h-64 w-full text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.06} vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={[50, 100]} stroke="#94a3b8" tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="attendance" name="Attendance Rate" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttendance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* STACKED BAR CHART: SUBJECT ATTENDANCE SPLIT */}
          <Card hoverEffect={false} className="p-6 space-y-6">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-955 dark:text-white flex items-center gap-1.5">
                <BarChart3 size={16} className="text-indigo-400" /> Subject Check-in Ratios
              </h4>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium">Total days present, absent, and late per course.</p>
            </div>
            <div className="h-64 w-full text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.subjectAttendance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.06} vertical={false} />
                  <XAxis dataKey="code" stroke="#94a3b8" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "12px" }} />
                  <Bar dataKey="present" name="Present" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="late" name="Late" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" stackId="a" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </motion.div>

        {/* CHART ROW 2 */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LINE CHART: ATTENDANCE PREDICTION */}
          <Card hoverEffect={false} className="p-6 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-955 dark:text-white">Attendance Forecast Model</h4>
                <Badge variant="success">AI Predict</Badge>
              </div>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium">Predicts future attendance trend if current check-in habits remain constant.</p>
            </div>
            <div className="h-64 w-full text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.06} vertical={false} />
                  <XAxis dataKey="week" stroke="#94a3b8" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis domain={[60, 100]} stroke="#94a3b8" tickLine={false} axisLine={false} tickMargin={8} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold", paddingTop: "12px" }} />
                  <Line type="monotone" dataKey="actual" name="Historical Rate" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="forecast" name="Forecast Future" stroke="#06B6D4" strokeDasharray="5 5" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="target" name="Minimum Target" stroke="#EF4444" strokeWidth={1} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* INTERACTIVE HEATMAP */}
          <Card hoverEffect={false} className="p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-955 dark:text-white flex items-center gap-1.5">
                <Calendar size={16} className="text-cyan-400" /> Weekly Presence Heatmap
              </h4>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 font-medium">Visual mapping of daily check-ins. Deeper blocks show higher activity.</p>
            </div>
            
            <div className="my-6">
              <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-bold text-slate-400 mb-2">
                <span>Week</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
              </div>
              
              <div className="space-y-2">
                {data?.heatmapData.map((weekData) => (
                  <div key={weekData.week} className="grid grid-cols-6 gap-2 text-center items-center">
                    <span className="text-[9px] font-mono text-slate-450">Wk {weekData.week}</span>
                    
                    {/* Monday Block */}
                    <div 
                      className={`h-9 rounded-lg border transition-all ${
                        weekData.Mon === 4 ? "bg-emerald-500/80 border-emerald-600 shadow-sm" :
                        weekData.Mon === 3 ? "bg-emerald-500/40 border-emerald-500/45" :
                        weekData.Mon === 2 ? "bg-amber-500/30 border-amber-500/35" :
                        weekData.Mon === 1 ? "bg-red-500/20 border-red-500/25" : "bg-slate-100 dark:bg-slate-900 border-slate-205 dark:border-slate-850"
                      }`}
                      title={`${weekData.Mon} check-ins`}
                    />

                    {/* Tuesday Block */}
                    <div 
                      className={`h-9 rounded-lg border transition-all ${
                        weekData.Tue === 4 ? "bg-emerald-500/80 border-emerald-600 shadow-sm" :
                        weekData.Tue === 3 ? "bg-emerald-500/40 border-emerald-500/45" :
                        weekData.Tue === 2 ? "bg-amber-500/30 border-amber-500/35" :
                        weekData.Tue === 1 ? "bg-red-500/20 border-red-500/25" : "bg-slate-100 dark:bg-slate-900 border-slate-205 dark:border-slate-850"
                      }`}
                      title={`${weekData.Tue} check-ins`}
                    />

                    {/* Wednesday Block */}
                    <div 
                      className={`h-9 rounded-lg border transition-all ${
                        weekData.Wed === 4 ? "bg-emerald-500/80 border-emerald-600 shadow-sm" :
                        weekData.Wed === 3 ? "bg-emerald-500/40 border-emerald-500/45" :
                        weekData.Wed === 2 ? "bg-amber-500/30 border-amber-500/35" :
                        weekData.Wed === 1 ? "bg-red-500/20 border-red-500/25" : "bg-slate-100 dark:bg-slate-900 border-slate-205 dark:border-slate-850"
                      }`}
                      title={`${weekData.Wed} check-ins`}
                    />

                    {/* Thursday Block */}
                    <div 
                      className={`h-9 rounded-lg border transition-all ${
                        weekData.Thu === 4 ? "bg-emerald-500/80 border-emerald-600 shadow-sm" :
                        weekData.Thu === 3 ? "bg-emerald-500/40 border-emerald-500/45" :
                        weekData.Thu === 2 ? "bg-amber-500/30 border-amber-500/35" :
                        weekData.Thu === 1 ? "bg-red-500/20 border-red-500/25" : "bg-slate-100 dark:bg-slate-900 border-slate-205 dark:border-slate-850"
                      }`}
                      title={`${weekData.Thu} check-ins`}
                    />

                    {/* Friday Block */}
                    <div 
                      className={`h-9 rounded-lg border transition-all ${
                        weekData.Fri === 4 ? "bg-emerald-500/80 border-emerald-600 shadow-sm" :
                        weekData.Fri === 3 ? "bg-emerald-500/40 border-emerald-500/45" :
                        weekData.Fri === 2 ? "bg-amber-500/30 border-amber-500/35" :
                        weekData.Fri === 1 ? "bg-red-500/20 border-red-500/25" : "bg-slate-100 dark:bg-slate-900 border-slate-205 dark:border-slate-850"
                      }`}
                      title={`${weekData.Fri} check-ins`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Color Legend */}
            <div className="flex gap-4 items-center justify-end text-[10px] font-bold text-slate-450 dark:text-slate-500 flex-wrap">
              <span>Key:</span>
              <div className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-850 rounded" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 bg-red-500/20 border border-red-500/25 rounded" />
                <span>Late</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 bg-emerald-500/40 border border-emerald-500/45 rounded" />
                <span>Partly</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3.5 w-3.5 bg-emerald-500/80 border border-emerald-600 rounded" />
                <span>Full Presence</span>
              </div>
            </div>
          </Card>

        </motion.div>

      </motion.div>
    </ErrorBoundary>
  );
};

export default AnalyticsPage;
