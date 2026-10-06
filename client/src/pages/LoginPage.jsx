import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ScanFace,
  QrCode,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import authService from "../services/authService";
import Button from "../components/Button";
import attendifyLogo from "../assets/attendify-logo.png";
import { useTheme } from "../context/ThemeContext";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      username: "aman.kumar@attendify.com",
      password: "password123"
    }
  });

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "student") {
      setValue("username", "aman.kumar@attendify.com");
    } else if (newRole === "teacher") {
      setValue("username", "rahul.sharma@attendify.com");
    } else if (newRole === "admin") {
      setValue("username", "admin@attendify.com");
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data.username, data.password, role);
      if (response.success) {
        toast.success(`Welcome back, ${response.user.name}!`);
        window.dispatchEvent(new Event("user_profile_updated"));
        const userRole = response.user?.role || role;
        if (userRole === "student") {
          navigate("/dashboard");
        } else if (userRole === "teacher") {
          navigate("/teacher");
        } else if (userRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Active demo email helper
  const activeDemoEmail = role === "student" 
    ? "aman.kumar@attendify.com" 
    : role === "teacher" 
      ? "rahul.sharma@attendify.com" 
      : "admin@attendify.com";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-[#03060d] font-sans text-slate-800 dark:text-slate-100 overflow-x-hidden relative transition-colors duration-300">
      
      {/* Floating Theme Toggle Control */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 sm:top-6 sm:right-6 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs z-30 cursor-pointer"
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* LEFT SIDE - BRANDED INTRODUCTION PANEL */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-600/5 via-indigo-500/5 to-transparent dark:from-[#080e1c] dark:via-[#0c1427] dark:to-[#03060d] relative flex-col justify-between p-12 border-r border-slate-200/80 dark:border-slate-850/80">
        
        {/* Brand Header */}
        <div className="space-y-6 text-left">
          <div className="flex items-center gap-3">
            <img 
              src={attendifyLogo} 
              alt="Attendify Logo" 
              className="h-10 w-10 rounded-2xl object-contain shadow-md flex-shrink-0"
            />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white font-sans">
              Attendify
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-sans text-slate-900 dark:text-white leading-tight">
              Smart Attendance Management
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Mark attendance securely using Face Verification or a time-based QR code.
            </p>
          </div>
        </div>

        {/* Compact Visual: Face + QR Verification Graphic */}
        <div className="my-8 relative flex items-center justify-center">
          <div className="w-full max-w-sm p-6 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs relative overflow-hidden space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Attendance Verification</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Graphic Representation */}
            <div className="h-44 w-full bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-850 flex items-center justify-around px-4 relative overflow-hidden">
              
              {/* Face Frame Box */}
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-indigo-500/60 dark:border-indigo-400/60 bg-indigo-500/5 flex items-center justify-center relative">
                  <ScanFace size={36} className="text-primary dark:text-indigo-400" />
                  <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-primary" />
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-primary" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Face Match</span>
              </div>

              <div className="text-slate-300 dark:text-slate-700 font-bold text-sm z-10">+</div>

              {/* QR Pattern Box */}
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-cyan-500/60 dark:border-cyan-400/60 bg-cyan-500/5 flex items-center justify-center relative">
                  <QrCode size={36} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Dynamic QR</span>
              </div>

              {/* Laser Scanning Line Effect */}
              <div className="scanner-line pointer-events-none" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
              <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-500" /> Anti-Spoof Protection</span>
              <span className="font-mono text-[10px] text-primary">30s Token</span>
            </div>
          </div>
        </div>

        {/* Feature Cards Column */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ScanFace size={14} className="text-primary" /> Face Verification
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
              Verify your identity using your registered face.
            </p>
          </div>

          <div className="p-3.5 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-1 shadow-xs">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <QrCode size={14} className="text-cyan-500" /> Dynamic QR
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
              Scan the classroom QR code to mark attendance.
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE - RIGHT LOGIN CARD */}
      <div className="col-span-1 lg:col-span-7 flex items-center justify-center p-4 sm:p-8 md:p-12 min-w-0">
        <div className="w-full max-w-md space-y-6 bg-white dark:bg-[#0c121e] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-300">
          
          {/* Header */}
          <div className="text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
              <img 
                src={attendifyLogo} 
                alt="Attendify Logo" 
                className="h-10 w-10 rounded-2xl object-contain shadow-md flex-shrink-0"
              />
              <span className="font-extrabold text-xl font-sans text-slate-900 dark:text-white">Attendify</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-sans text-slate-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Sign in to continue to your attendance dashboard.
            </p>
          </div>

          {/* ROLE SELECTOR GRID */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Select Role Profile
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "student", label: "Student", icon: GraduationCap },
                { id: "teacher", label: "Teacher", icon: Sparkles },
                { id: "admin", label: "Admin", icon: ShieldCheck }
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleChange(r.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 dark:bg-primary/20 border-primary text-primary dark:text-blue-400 shadow-xs"
                        : "bg-slate-100/60 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User size={16} />
                </span>
                <input
                  type="email"
                  {...register("username", { required: "Email address is required" })}
                  className="glass-input pl-10 pr-4 py-2.5 w-full text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl"
                  placeholder="name@college.edu"
                />
              </div>
              {errors.username && (
                <p className="text-[10px] text-red-500 font-medium mt-1">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary dark:text-blue-400 hover:underline font-semibold"
                  onClick={() => toast.success("Password reset assistance dispatched to registered email.")}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", { required: "Password is required" })}
                  className="glass-input pl-10 pr-10 py-2.5 w-full text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-500 font-medium mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* REMEMBER ME CHECKBOX */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary/45 border-slate-300 dark:border-slate-800 rounded bg-white dark:bg-slate-950"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-600 dark:text-slate-400 select-none">
                Remember me on this device
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold shadow-md shadow-primary/20 hover:shadow-primary/30 mt-2 gap-2 py-3 rounded-xl"
              loading={isLoading}
            >
              Sign In
              <ArrowRight size={16} />
            </Button>
          </form>

          {/* SUBTLE DEMO CREDENTIAL NOTICE */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Demo Account: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{activeDemoEmail}</span>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
