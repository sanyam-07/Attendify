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
  EyeOff
} from "lucide-react";
import toast from "react-hot-toast";
import authService from "../services/authService";
import Button from "../components/Button";

export const LoginPage = () => {
  const navigate = useNavigate();
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
      username: "alex.rivera",
      password: "password123"
    }
  });

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "student") {
      setValue("username", "alex.rivera@attendify.com");
    } else if (newRole === "teacher") {
      setValue("username", "sarah.jenkins@attendify.com");
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
        const userRole = response.user.role || role;
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

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-[#03060d] font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* LEFT PANE - UPGRADED HIGH-TECH SCANNER FEED */}
      <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-[#050811] via-slate-950 to-indigo-950/80 relative flex-col items-center justify-center p-12 border-r border-slate-900/60">
        <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-primary/10 rounded-full blur-[90px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-cyan-500/10 rounded-full blur-[90px]" />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
          {/* Facial wireframe box */}
          <div className="relative h-72 w-72 rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden mb-12 flex items-center justify-center shadow-2xl glow-primary">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:18px_18px] opacity-25" />
            
            {/* SVG mesh nodes */}
            <motion.svg
              width="170"
              height="170"
              viewBox="0 0 100 100"
              className="text-cyan-400 stroke-current stroke-[1.5] fill-none relative z-10"
              animate={{ scale: [0.98, 1.02, 0.98] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <path d="M25,32 Q25,18 50,18 Q75,18 75,32 Q75,62 50,78 Q25,62 25,32 Z" className="stroke-indigo-500/80" />
              <path d="M30,35 Q30,22 50,22 Q70,22 70,35 Q70,58 50,72 Q30,58 30,35 Z" className="stroke-cyan-500/40" strokeDasharray="2,2" />
              <circle cx="38" cy="38" r="2.5" className="fill-cyan-400" />
              <circle cx="62" cy="38" r="2.5" className="fill-cyan-400" />
              <path d="M50,44 L50,54 L46,54" />
              <path d="M42,62 Q50,67 58,62" />
              <circle cx="50" cy="18" r="1.5" className="fill-indigo-400" />
              <circle cx="25" cy="32" r="1.5" className="fill-indigo-400" />
              <circle cx="75" cy="32" r="1.5" className="fill-indigo-400" />
              <circle cx="50" cy="78" r="1.5" className="fill-indigo-400" />
              <line x1="38" y1="38" x2="50" y2="44" className="stroke-cyan-500/30" />
              <line x1="62" y1="38" x2="50" y2="44" className="stroke-cyan-500/30" />
              <line x1="38" y1="38" x2="25" y2="32" className="stroke-indigo-500/30" />
              <line x1="62" y1="38" x2="75" y2="32" className="stroke-indigo-500/30" />
              <line x1="50" y1="44" x2="50" y2="78" className="stroke-indigo-500/20" strokeDasharray="3,3" />
            </motion.svg>

            {/* Scanning sweeping laser */}
            <div className="scanner-line" />
            
            {/* Corner tags */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/80" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/80" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/80" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/80" />
          </div>

          <h2 className="text-2xl font-extrabold font-sans mb-3 text-white">Secure Biometric Verification</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Access secure college check-ins instantly. Facial descriptor points serve as credentials templates.
          </p>
        </div>
      </div>

      {/* RIGHT PANE - FORM INTERACTION */}
      <div className="flex col-span-1 lg:col-span-6 items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8 bg-white/40 dark:bg-transparent p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-transparent">
          
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-base shadow-md">
              ⚡
            </div>
            <span className="font-extrabold text-md font-sans text-slate-900 dark:text-white">Attendify</span>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-sans text-slate-950 dark:text-white">
              Sign in to platform
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Select your role profile to automatically load default demo credentials.
            </p>
          </div>

          {/* ROLE SELECTOR GRID */}
          <div className="grid grid-cols-3 gap-2.5">
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
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/5 dark:bg-primary/10 border-primary text-primary dark:text-blue-400 shadow-sm"
                      : "bg-white dark:bg-[#0c121e]/60 border-slate-200/50 dark:border-slate-800 text-slate-500 hover:border-slate-350 dark:hover:border-slate-700"
                  }`}
                >
                  <Icon size={18} />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  {...register("username", { required: "Username is required" })}
                  className="glass-input pl-10 pr-4 py-3 w-full text-xs text-slate-900 dark:text-white"
                  placeholder="Enter your credential name"
                />
              </div>
              {errors.username && (
                <p className="text-[10px] text-danger mt-1">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-primary dark:text-indigo-400 hover:underline font-semibold"
                  onClick={() => toast.success("Password reset code dispatched to registered mail.")}
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
                  className="glass-input pl-10 pr-10 py-3 w-full text-xs text-slate-900 dark:text-white"
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
                <p className="text-[10px] text-danger mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary/45 border-slate-350 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
                Remember session credentials
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold shadow-md shadow-primary/20 hover:shadow-primary/30 mt-4 gap-2 py-3"
              loading={isLoading}
            >
              Sign In to Attendify
              <ArrowRight size={16} />
            </Button>
          </form>

          {/* BACKEND CONFIG NOTE */}
          <div className="pt-6 border-t border-slate-200/50 dark:border-slate-850">
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <h5 className="text-[11px] font-bold text-indigo-400 flex items-center gap-1.5">
                <Sparkles size={12} className="animate-spin-slow" />
                MERN Stack Integration Tips:
              </h5>
              <p className="text-[9.5px] text-slate-550 dark:text-slate-400 leading-relaxed mt-1">
                To connect a real database later, configure `server/routes/authRoute.js` to dispatch JWT tokens via cookies or Auth headers, then substitute `authService.js` logins with Axios endpoints.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;
