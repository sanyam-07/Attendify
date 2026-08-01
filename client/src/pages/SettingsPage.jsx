import React from "react";
import { motion } from "framer-motion";
import { 
  Sun, 
  Moon, 
  Bell, 
  Globe, 
  Database, 
  Code
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useTheme } from "../context/ThemeContext";
import ErrorBoundary from "../components/ErrorBoundary";

export const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();

  const handleSaveSettings = () => {
    toast.success("Preferences saved successfully!");
  };

  const mernIntegrationRoutes = [
    { method: "POST", path: "/api/auth/login", desc: "JWT session login endpoint" },
    { method: "POST", path: "/api/attendance/session/start", desc: "Teacher launches session & dynamic QR codes" },
    { method: "POST", path: "/api/attendance/verify", desc: "Verifies student face mesh vs database templates" },
    { method: "GET", path: "/api/students/profile", desc: "Retrieve course compliance and analytic cards" }
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
        
        {/* HEADER BANNER */}
        <motion.div variants={itemVariants} className="border-b border-slate-205 dark:border-slate-850 pb-5">
          <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
            Settings & Configurations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
            Adjust preferences, themes, language selections, and inspect future MERN backend developer integrations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: SYSTEM PREFERENCES */}
          <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
            
            {/* Theme card selection */}
            <Card hoverEffect={false} className="p-6 space-y-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-955 dark:text-white">Theme Style Settings</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 font-medium">Select application visual representation preference.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => theme === "light" && toggleTheme()}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                    theme === "dark"
                      ? "bg-primary/5 dark:bg-primary/10 border-primary text-primary dark:text-blue-400 shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550 hover:border-slate-400"
                  }`}
                >
                  <Moon size={16} />
                  <span>Dark Slate Mode</span>
                </button>
                
                <button
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                    theme === "light"
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:hover:border-slate-700"
                  }`}
                >
                  <Sun size={16} />
                  <span>Light Clean Mode</span>
                </button>
              </div>
            </Card>

            {/* Languages & Alerts Preferences */}
            <Card hoverEffect={false} className="p-6 space-y-5">
              <h4 className="font-extrabold text-sm text-slate-905 dark:text-white">Alerts & Language</h4>
              
              <div className="space-y-4.5 text-xs font-medium">
                <div className="space-y-2">
                  <label className="font-bold text-slate-450 flex items-center gap-1.5"><Globe size={13} /> Platform Language</label>
                  <select className="glass-input px-3.5 py-2.5 w-full bg-transparent text-slate-850 dark:text-slate-200 text-xs">
                    <option value="en" className="bg-slate-900">English (United States)</option>
                    <option value="es" className="bg-slate-900">Español</option>
                    <option value="fr" className="bg-slate-900">Français</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="font-bold text-slate-455 flex items-center gap-1.5"><Bell size={13} /> Notification Subscriptions</label>
                  
                  <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/20 p-4 border border-slate-200/50 dark:border-slate-850 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-750 dark:text-slate-300">Email session notifications</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded bg-transparent accent-primary" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-750 dark:text-slate-300">Browser pop-up alert warning notifications</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded bg-transparent accent-primary" />
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Deficit warning sms push notification alerts</span>
                      <input type="checkbox" className="h-4 w-4 rounded bg-transparent accent-primary" />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <Button onClick={handleSaveSettings} variant="primary" size="sm" className="font-bold text-xs rounded-xl px-5">
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>

          </motion.div>

          {/* RIGHT COLUMN: DEVELOPER MERN SANDBOX CHECKS */}
          <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
            <Card hoverEffect={false} className="p-6 space-y-6 bg-gradient-to-br from-indigo-950/10 via-transparent to-transparent">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-white flex items-center gap-2">
                  <Code size={16} className="text-indigo-400" /> Backend Routing Schemas
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 font-medium">Architecture endpoints mapped for subsequent Node/Mongo implementation runs.</p>
              </div>

              {/* Routes details */}
              <div className="space-y-3">
                {mernIntegrationRoutes.map((route, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-850 rounded-xl space-y-1 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        route.method === "POST" ? "bg-cyan-950 text-cyan-400" : "bg-blue-950 text-blue-400"
                      }`}>
                        {route.method}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-300">{route.path}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium leading-relaxed">{route.desc}</p>
                  </div>
                ))}
              </div>

              {/* Mongoose models summary */}
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-3">
                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Database size={12} /> MongoDB Schemas
                </h5>
                <div className="flex flex-wrap gap-1.5 text-[9px]">
                  <Badge variant="neutral">Users (Student/Teacher/Admin)</Badge>
                  <Badge variant="neutral">AttendanceRecords</Badge>
                  <Badge variant="neutral">ClassSessions</Badge>
                  <Badge variant="neutral">Assignments</Badge>
                </div>
              </div>

            </Card>
          </motion.div>

        </div>
        
      </motion.div>
    </ErrorBoundary>
  );
};

export default SettingsPage;
