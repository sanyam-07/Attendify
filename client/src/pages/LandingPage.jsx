import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ScanFace, 
  QrCode, 
  LineChart, 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  Plus, 
  Minus, 
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X,
  User,
  Clock,
  Users,
  Check
} from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import { useTheme } from "../context/ThemeContext";
import attendifyLogo from "../assets/attendify-logo.png";

export const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeFaq, setActiveFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const capabilities = [
    { value: "2 Verification Methods", label: "Face Verification + QR Code" },
    { value: "30 Second QR Security", label: "Time-limited rotating QR token" },
    { value: "3 Security Checks", label: "Face Match + Liveness + Session Validation" },
    { value: "3 User Roles", label: "Student • Teacher • Admin" }
  ];

  const features = [
    {
      icon: ScanFace,
      title: "Face Verification",
      desc: "Verify student identity using the device camera and registered face data."
    },
    {
      icon: QrCode,
      title: "Dynamic QR Attendance",
      desc: "Use a time-limited QR code as a fast alternative attendance method."
    },
    {
      icon: Sparkles,
      title: "Liveness & Anti-Spoofing",
      desc: "Use blink and movement checks to reduce photo and replay-based attempts."
    },
    {
      icon: LineChart,
      title: "Attendance Analytics",
      desc: "View attendance rates, subject-wise performance, trends, and compliance insights."
    },
    {
      icon: GraduationCap,
      title: "Smart Curriculum",
      desc: "Access class schedules, subjects, assignments, and examination information."
    },
    {
      icon: ShieldCheck,
      title: "Role-Based Dashboards",
      desc: "Separate tools and information for students, teachers, and administrators."
    }
  ];

  const steps = [
    {
      num: 1,
      title: "Teacher Starts Session",
      desc: "Teacher starts an attendance session for the selected class and subject."
    },
    {
      num: 2,
      title: "Student Verifies Identity",
      desc: "Student uses Face Verification or scans the active Teacher QR code."
    },
    {
      num: 3,
      title: "Attendance is Recorded",
      desc: "The server validates the session and verification before recording attendance."
    }
  ];

  const roleOverview = [
    {
      role: "STUDENT",
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      items: [
        "Mark Attendance",
        "View Attendance",
        "View Curriculum",
        "View Notifications"
      ]
    },
    {
      role: "TEACHER",
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      items: [
        "Start Attendance Session",
        "Display QR",
        "Monitor Attendance",
        "Manage Classes"
      ]
    },
    {
      role: "ADMIN",
      color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
      items: [
        "Manage Users",
        "Manage Academic Data",
        "Monitor Attendance",
        "View Reports"
      ]
    }
  ];

  const faqs = [
    {
      q: "How does Face Verification work?",
      a: "Attendify uses facial feature extraction and matching. The system validates the student's face against their registered descriptor while running liveness checks to ensure a real person is present."
    },
    {
      q: "What happens if face verification fails?",
      a: "If face verification fails or the camera is unavailable, students can scan the teacher's active dynamic QR code as an alternative verification method."
    },
    {
      q: "How long is the QR code valid?",
      a: "The QR security token rotates every 30 seconds to prevent students from sharing static screenshots with absent classmates."
    },
    {
      q: "Can a student mark attendance without an active session?",
      a: "No. Attendance verification requires an active teacher attendance session for that specific class and schedule slot."
    },
    {
      q: "What roles are available in Attendify?",
      a: "Attendify supports three distinct role profiles: Student, Teacher, and Admin, each with tailored tools and dashboard views."
    },
    {
      q: "How does Attendify help prevent proxy attendance?",
      a: "Proxy attendance is prevented through multi-factor validation combining biological face matching, liveness detection, 30-second time-rotating QR codes, and active session verification."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#03060d] text-slate-900 dark:text-slate-100 min-h-screen overflow-x-hidden font-sans transition-colors duration-300">
      
      {/* 1. HEADER NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-[#03060d]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-900/60 z-50 px-4 sm:px-8 flex items-center justify-between transition-colors duration-300">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={attendifyLogo} 
            alt="Attendify Logo" 
            className="h-10 w-10 rounded-2xl object-contain shadow-md flex-shrink-0"
          />
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-sans">
            Attendify
          </span>
        </Link>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link to="/login">
            <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-sm">
              Sign In
            </Button>
          </Link>

          <Link to="/login">
            <Button variant="primary" className="glow-primary text-xs sm:text-sm font-bold rounded-xl px-5">
              Launch Demo <ChevronRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>

        {/* Mobile Header Controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-0 right-0 bg-white dark:bg-[#060a12] border-b border-slate-200 dark:border-slate-800 p-6 z-40 md:hidden shadow-xl space-y-3"
          >
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-center text-slate-700 dark:text-slate-200 font-bold text-sm">
                Sign In
              </Button>
            </Link>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full justify-center glow-primary font-bold text-sm rounded-xl">
                Launch Demo Console <ChevronRight size={14} className="ml-1" />
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HERO SECTION */}
      <section className="relative pt-36 sm:pt-44 pb-20 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 h-[300px] sm:h-[350px] w-[90%] sm:w-[800px] bg-gradient-to-tr from-primary/10 via-indigo-500/10 to-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 dark:bg-slate-900/80 border border-blue-500/20 dark:border-slate-800 text-xs font-bold text-primary dark:text-cyan-400 mb-8 shadow-xs"
        >
          <Sparkles size={13} className="animate-pulse" />
          <span className="tracking-wide">Smart Attendance System</span>
        </motion.div>

        {/* Hero Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight font-sans max-w-5xl leading-[1.1] mb-6 text-slate-900 dark:text-white"
        >
          Smart Attendance for{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
            Modern Colleges
          </span>
        </motion.h1>

        {/* Hero Supporting Text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-lg md:text-xl text-slate-600 dark:text-slate-350 max-w-3xl leading-relaxed mb-10 px-2 font-normal"
        >
          Prevent proxy attendance with face verification, liveness detection, and time-based QR attendance. Attendify helps students and teachers manage attendance securely from a single platform.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center px-4"
        >
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto glow-primary px-8 font-bold text-sm">
              Get Started
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 border-slate-300 dark:border-slate-800 text-slate-800 dark:text-white font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-900/60">
              View Demo
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* 3. REALISTIC PROJECT CAPABILITIES */}
      <section className="py-12 border-y border-slate-200/80 dark:border-slate-900 bg-white/60 dark:bg-[#060a12]/60 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {capabilities.map((cap, i) => (
            <div key={i} className="bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs text-center space-y-1">
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans">
                {cap.value}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                {cap.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto relative">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">
            Everything You Need for Smart Attendance
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto font-medium leading-relaxed">
            Attendify combines secure attendance verification with student, teacher, and administrator dashboards.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div key={i} variants={itemVariants}>
                <Card className="text-left bg-white dark:bg-[#0c121e] border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between h-full hover:shadow-md dark:hover:border-slate-700 transition-all duration-300">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-primary dark:text-indigo-400 flex items-center justify-center mb-5 border border-blue-500/20">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-base font-bold font-sans text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">{feat.desc}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 5. HOW ATTENDIFY WORKS */}
      <section className="py-20 border-t border-slate-200/80 dark:border-slate-900 bg-slate-100/50 dark:bg-[#060a12]/40 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">How Attendify Works</h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">Attendance can be verified in a few simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center p-6 sm:p-8 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3.5 shadow-xs">
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm mx-auto shadow-md">
                  {step.num}
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PROJECT OVERVIEW SECTION */}
      <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans text-slate-900 dark:text-white">
            Built for College Attendance
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto font-medium leading-relaxed">
            Attendify is a MERN-stack attendance management system designed for colleges. It connects students, teachers, and administrators through role-based dashboards while providing face verification and dynamic QR attendance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleOverview.map((item, idx) => (
            <Card key={idx} className="p-6 bg-white dark:bg-[#0c121e] border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider border ${item.color}`}>
                  {item.role}
                </span>
                <Users size={16} className="text-slate-400" />
              </div>
              <ul className="space-y-3 text-left">
                {item.items.map((sub, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="py-20 px-4 sm:px-8 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-4xl font-black font-sans text-center mb-12 text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition shadow-xs"
                onClick={() => setActiveFaq(isOpen ? null : index)}
              >
                <div className="flex items-center justify-between p-5 text-left">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{faq.q}</span>
                  <div className="text-slate-500 dark:text-slate-400 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg flex-shrink-0">
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </div>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3.5 text-left leading-relaxed font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-slate-900 bg-slate-100 dark:bg-[#060a12] py-12 px-4 sm:px-8 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-xs font-medium">
          <div className="flex items-center gap-3">
            <img 
              src={attendifyLogo} 
              alt="Attendify Logo" 
              className="h-8 w-8 rounded-xl object-contain shadow-md flex-shrink-0"
            />
            <span className="font-extrabold text-sm text-slate-900 dark:text-white font-sans">Attendify</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
            © 2026 Attendify. Smart Attendance System for Colleges.
          </p>
          <div className="flex gap-6 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
            <Link to="/login" className="hover:underline">Student Console</Link>
            <Link to="/login" className="hover:underline">Teacher Console</Link>
            <Link to="/login" className="hover:underline">Admin Console</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
