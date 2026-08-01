import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ScanFace, 
  QrCode, 
  LineChart, 
  GraduationCap, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Plus,
  Minus,
  Lock,
  ChevronRight
} from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";

export const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  const stats = [
    { value: "99.9%", label: "Anti-Proxy Accuracy" },
    { value: "0.2s", label: "Face Recognition Latency" },
    { value: "50+", label: "Partner Universities" },
    { value: "1.2M+", label: "Verified Check-ins" }
  ];

  const features = [
    {
      icon: ScanFace,
      title: "AI Face Recognition",
      desc: "Instant biological check-ins using 3D facial scans. Employs advanced deep learning models to secure attendance records.",
      comingSoon: false
    },
    {
      icon: QrCode,
      title: "Dynamic QR Verification",
      desc: "High-security QR codes refreshing every 10 seconds. Students must scan in class to prevent geo-spoofing.",
      comingSoon: false
    },
    {
      icon: LineChart,
      title: "Real-time Analytics",
      desc: "Beautiful automated reports and attendance warning warnings for students, professors, and administration.",
      comingSoon: false
    },
    {
      icon: GraduationCap,
      title: "Smart Curriculum sync",
      desc: "Syncs syllabus completions, lecture timetables, assignment tasks, and practical examination files.",
      comingSoon: false
    },
    {
      icon: Sparkles,
      title: "Anti-Spoof & Liveness",
      desc: "Biometric checker validating student blinking and active liveness feedback parameters.",
      comingSoon: true
    },
    {
      icon: ShieldCheck,
      title: "GPS Geofencing Verification",
      desc: "Validates coordinate locations on check-in to confirm students are physically inside the lecture hall.",
      comingSoon: true
    }
  ];

  const faqs = [
    {
      q: "How does the face recognition prevent proxy attendance?",
      a: "Attendify relies on biological matching metrics coupled with planned anti-spoof liveness detections (blink and liveness checkers). An static image or recorded video of a student will be rejected by the validation models."
    },
    {
      q: "What happens if a student has camera issues or poor lighting?",
      a: "If biometric checks fail after two retries, the platform prompts the student with a fallback option to scan a dynamic, time-rotating QR code displayed by the teacher's dashboard."
    },
    {
      q: "How fast is the dynamic QR code refreshed?",
      a: "The teacher's QR code expires and regenerates every 10 seconds. Students must scan it immediately. If they try to share a screenshot, it will have expired by the time another student attempts to scan it."
    },
    {
      q: "Is the platform MERN scalable?",
      a: "Yes. Every element of the prototype is mapped into isolated service structures. It can immediately support Node.js controllers, Mongoose schemas, and JWT security keys without changing UI component architecture."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="bg-[#03060d] text-slate-100 min-h-screen overflow-x-hidden selection:bg-primary/30 selection:text-white font-sans">
      
      {/* 1. HEADER */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-[#03060d]/80 backdrop-blur-xl border-b border-slate-900/60 z-50 px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20 glow-primary">
            ⚡
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent font-sans">
            Attendify
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:inline">
            <Button variant="ghost" className="text-slate-400 hover:text-white font-bold text-sm">
              Sign In
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="primary" className="glow-primary text-xs sm:text-sm font-semibold rounded-xl px-5">
              Launch Demo <ChevronRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-44 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow vector meshes */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 h-[350px] w-[500px] sm:w-[800px] bg-gradient-to-tr from-primary/10 via-secondary/10 to-accent/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Sparkles Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-slate-950/80 border border-slate-800/80 text-xs font-semibold text-cyan-400 mb-10 shadow-xl"
        >
          <Sparkles size={13} className="animate-pulse" />
          <span className="tracking-wide">AI-Powered Smart Attendance</span>
        </motion.div>

        {/* Hero title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight font-sans max-w-5xl leading-[1.05] mb-8"
        >
          AI-Based Attendance for{" "}
          <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">
            Modern Colleges
          </span>
        </motion.h1>

        {/* Hero subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-xl text-slate-400 max-w-3xl leading-relaxed mb-12 px-2"
        >
          Eliminate proxy attendance using instant biometric face recognition and time-rotating dynamic QR codes. Built for student compliance and teacher analytics.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4"
        >
          <Link to="/login">
            <Button variant="primary" size="lg" className="w-full sm:w-auto glow-primary px-10 font-bold text-sm">
              Get Started Free
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-10 border-slate-800 hover:bg-slate-900/60 text-white font-bold text-sm">
              View Demo console
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* 3. STATISTICS ROW */}
      <section className="py-16 border-y border-slate-900/80 bg-slate-950/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              <p className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-sans">
                {stat.value}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURE GRID */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative">
        <div className="absolute top-1/2 right-12 h-[350px] w-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="text-center mb-20 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans">
            Secured attendance ecosystems
          </h2>
          <p className="text-slate-450 text-sm max-w-xl mx-auto">
            Packed with smart biometric scanning mechanisms and rich dashboards for students and college administration.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div key={i} variants={itemVariants}>
                <Card className="text-left bg-slate-950/40 border-slate-900/80 p-7 flex flex-col justify-between h-full hover:border-slate-805 hover:bg-slate-950/60 transition-all duration-300">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center text-primary mb-6">
                      <Icon size={24} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <h3 className="text-base font-bold font-sans text-white">{feat.title}</h3>
                      {feat.comingSoon && (
                        <span className="text-[9px] font-bold bg-cyan-950/50 text-cyan-400 border border-cyan-800/40 rounded px-2 py-0.5">
                          COMING SOON
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-24 border-t border-slate-900/60 bg-slate-950/10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-white">Three Steps to Verify</h2>
            <p className="text-slate-450 text-sm">Automated geofencing checks for swift lecture check-ins.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: 1, title: "Teacher Starts Session", desc: "The professor initiates check-in from the console. Students immediately receive a push notification." },
              { num: 2, title: "Biometric Face Match", desc: "Students scan their face vector fields on their device, which performs rapid liveness and detection filters." },
              { num: 3, title: "Fallback Dynamic QR", desc: "If face matching fails, the student scans the rotating security QR displayed on the main class screen." }
            ].map((step, i) => (
              <div key={i} className="text-center p-8 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center font-bold text-sm mx-auto shadow-md">
                  {step.num}
                </div>
                <h4 className="font-bold text-sm text-white">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-32 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-black font-sans text-center mb-16">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="bg-slate-950/30 border border-slate-900 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-805 transition duration-200"
                onClick={() => setActiveFaq(isOpen ? null : index)}
              >
                <div className="flex items-center justify-between p-6 text-left">
                  <span className="font-bold text-sm sm:text-base text-white">{faq.q}</span>
                  <div className="text-slate-400 p-1 bg-slate-900 rounded-lg">
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </div>
                </div>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-slate-400 border-t border-slate-900 pt-4 text-left leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-16 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-md">
              ⚡
            </div>
            <span className="font-extrabold text-sm text-white">Attendify</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Designed with high-fidelity glassmorphic vectors. Academic MERN-Ready Sandbox.
          </p>
          <div className="flex gap-6 text-[11px] text-slate-450">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
