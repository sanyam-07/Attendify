import Human from "@vladmandic/human";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Camera,
  CheckCircle,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  RefreshCw
} from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { studentService } from "../services/studentService";
import ErrorBoundary from "../components/ErrorBoundary";

export const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Biometric registration UI state: 'idle' | 'preparing' | 'capturing' | 'saving' | 'completed'
  const [bioState, setBioState] = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [isFlashActive, setIsFlashActive] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const loadProfile = async () => {
    try {
      const data = await studentService.getProfile();
      setProfile(data);
      reset(data);
    } catch (err) {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onUpdateProfile = (formData) => {
    const updated = { ...profile, ...formData };
    setProfile(updated);
    localStorage.setItem("attendify_user", JSON.stringify(updated));
    toast.success("Profile details updated successfully!");
  };

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const humanRef = React.useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const startWebcam = async () => {
    stopWebcam();
    setCameraError(null);

    try {
      let mediaStream;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current.play();
            } catch (e) {
              console.warn(e);
            }
            resolve();
          };
        });
      }

    } catch (err) {
      console.error(err);
      setCameraError("Camera access denied.");
      toast.error("Could not access camera.");
      throw err;
    }
  };

  // Guarantee MediaStream is bound to video element once mounted & play is invoked
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => console.error("Profile video play error:", err));
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    const loadAI = async () => {
      try {
        const human = new Human({
          modelBase: "/models",

          cacheSensitivity: 0,

          face: {
            enabled: true,

            detector: {
              enabled: true,
              rotation: true
            },

            description: {
              enabled: true
            },

            mesh: {
              enabled: false
            },

            iris: {
              enabled: false
            },

            emotion: {
              enabled: false
            }
          },

          body: {
            enabled: false
          },

          hand: {
            enabled: false
          },

          object: {
            enabled: false
          }
        });

        console.log("Loading Human Models...");

        await human.load();

        console.log("Warmup...");

        await human.warmup();

        humanRef.current = human;

        setModelsLoaded(true);

        console.log("✅ Human Models Loaded");
      } catch (err) {
        console.error("Human Load Error:", err);
      }
    };

    loadAI();
  }, []);

  // Triggers real camera biometric capture
  const handleRegisterFace = async () => {
    try {
      await startWebcam();

      setBioState("preparing");
      setCountdown(3);

      const waitForCamera = async () => {
        return new Promise((resolve, reject) => {
          let attempts = 0;

          const timer = setInterval(() => {
            attempts++;

            if (
              videoRef.current &&
              videoRef.current.readyState >= 2 &&
              videoRef.current.videoWidth > 0
            ) {
              clearInterval(timer);
              resolve();
            }

            if (attempts > 50) {
              clearInterval(timer);
              reject(new Error("Camera initialization timeout."));
            }
          }, 100);
        });
      };

      await waitForCamera();

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            triggerCapture();
            return 0;
          }

          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      console.error(err);
      toast.error("Camera failed to initialize.");
      stopWebcam();
      setBioState("idle");
    }
  };
const triggerCapture = () => {
  console.log("Trigger Capture Called");

  setBioState("capturing");
  setIsFlashActive(true);

  try {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera is not ready.");
      setBioState("idle");
      return;
    }

    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Camera stream is not ready.");
      setBioState("idle");
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    console.log("Image Captured Successfully");

    setTimeout(async () => {
      try {
        setIsFlashActive(false);
        setBioState("saving");

        // ---------------- AI DETECTION ----------------

        if (!modelsLoaded || !humanRef.current) {
          toast.error("AI Models are still loading...");
          setBioState("idle");
          stopWebcam();
          return;
        }

        const result = await humanRef.current.detect(video);

        console.log("Human Result:", result);

        if (!result.face || result.face.length === 0) {
          toast.error("No face detected.");
          setBioState("idle");
          stopWebcam();
          return;
        }

        const face = result.face[0];

        console.log("Detected Face:", face);

        const embedding =
          face.embedding ||
          face.descriptor ||
          face.tensor ||
          face.vector ||
          null;

        if (!embedding) {
          toast.error("Embedding not generated.");
          setBioState("idle");
          stopWebcam();
          return;
        }

        console.log("Embedding Length:", embedding.length);

        // ---------------- SEND TO BACKEND ----------------

        const res = await studentService.registerFace({
          embedding: Array.from(embedding),
        });

        console.log("Register API Response:", res);

        if (res.success) {
          toast.success("Face Registered Successfully!");

          setBioState("completed");

          await loadProfile();
        } else {
          toast.error(res.message || "Registration failed.");
          setBioState("idle");
        }
      } catch (err) {
        console.error(err);

        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Face Registration Failed"
        );

        setBioState("idle");
      } finally {
        stopWebcam();
      }
    }, 500);
  } catch (err) {
    console.error(err);

    toast.error("Capture failed");

    setBioState("idle");

    stopWebcam();
  }
};

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="avatar" />
        <Skeleton variant="card" count={2} />
      </div>
    );
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
        className="space-y-8 text-left"
      >

        {/* SHUTTER FLASH SCREEN OVERLAY */}
        <AnimatePresence>
          {isFlashActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* HEADER */}
        <motion.div variants={itemVariants} className="border-b border-slate-205 dark:border-slate-855 pb-5">
          <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
            <User className="text-primary" /> Profile Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1.5 font-medium leading-relaxed">
            Manage your personal identifiers, register face metadata, and update contact credentials.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: GENERAL PROFILE VIEW & EDIT */}
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">

            {/* Main User Card */}
            <Card hoverEffect={false} className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent shadow-sm">
              <img
                src={profile?.avatar}
                alt={profile?.name}
                className="h-24 w-24 rounded-2xl border border-slate-200 dark:border-slate-800 object-cover flex-shrink-0"
              />
              <div className="space-y-3.5 flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h3 className="text-lg font-black text-slate-950 dark:text-white truncate">{profile?.name}</h3>
                  <Badge variant={profile?.faceRegistered ? "success" : "danger"}>
                    {profile?.faceRegistered ? "Face Enrolled" : "No Face Registered"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <p className="flex items-center gap-2 justify-center sm:justify-start"><GraduationCap size={14} className="text-slate-400" /> {profile?.enrollmentNo}</p>
                  <p className="flex items-center gap-2 justify-center sm:justify-start"><Briefcase size={14} className="text-slate-400" /> {profile?.department}</p>
                  <p className="flex items-center gap-2 justify-center sm:justify-start"><Mail size={14} className="text-slate-400" /> {profile?.email}</p>
                  <p className="flex items-center gap-2 justify-center sm:justify-start"><Phone size={14} className="text-slate-400" /> {profile?.phone}</p>
                </div>
              </div>
            </Card>

            {/* Edit Profile Form */}
            <Card hoverEffect={false} className="p-6 space-y-5">
              <h4 className="font-extrabold text-sm text-slate-905 dark:text-white">Edit Profile Details</h4>

              <form onSubmit={handleSubmit(onUpdateProfile)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1.5 text-left">
                  <label className="text-slate-450">Full Name</label>
                  <input
                    type="text"
                    {...register("name", { required: true })}
                    className="glass-input px-3.5 py-2.5 w-full text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-slate-450">Contact Email</label>
                  <input
                    type="email"
                    {...register("email", { required: true })}
                    className="glass-input px-3.5 py-2.5 w-full text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-slate-450">Mobile Phone</label>
                  <input
                    type="text"
                    {...register("phone", { required: true })}
                    className="glass-input px-3.5 py-2.5 w-full text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-slate-450">Enrollment Number</label>
                  <input
                    type="text"
                    disabled
                    {...register("enrollmentNo")}
                    className="glass-input px-3.5 py-2.5 w-full bg-slate-100/50 dark:bg-slate-900/50 text-slate-450 border-slate-200/50 dark:border-slate-850 cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 flex justify-end">
                  <Button type="submit" variant="primary" size="sm" className="font-bold text-xs rounded-xl px-5">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>

          </motion.div>

          {/* RIGHT COLUMN: FACE BIOMETRIC REGISTRATION */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
            <Card hoverEffect={false} className="p-6 text-center space-y-5">
              <div className="text-left space-y-1">
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-white">Face Biometrics Enrollment</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450 font-medium">Enroll your facial features to enable instant verification check-ins.</p>
              </div>

              {/* WEBCAM SCAN FEED */}
              <div className="h-56 w-full rounded-2xl bg-slate-950 border border-slate-850 relative overflow-hidden flex items-center justify-center shadow-inner">
                {stream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-2xl relative z-0"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
                )}

                <AnimatePresence mode="wait">
                  {/* 1. Idle mode */}
                  {bioState === "idle" && !profile?.faceRegistered && (
                    <motion.div key="idle" className="text-center p-4 z-10 space-y-3">
                      <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400 shadow-md">
                        <Camera size={20} />
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold">Camera feed ready.</p>
                    </motion.div>
                  )}

                  {/* 2. Countdown Preparing mode */}
                  {bioState === "preparing" && (
                    <motion.div
                      key="prep"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="z-10 font-sans font-extrabold text-4xl text-primary flex flex-col items-center gap-2"
                    >
                      <span>{countdown}</span>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">Position Face</span>
                    </motion.div>
                  )}

                  {/* 3. Extracting and Saving mode */}
                  {bioState === "saving" && (
                    <motion.div key="saving" className="text-center p-4 z-10 space-y-3">
                      <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
                      <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Analyzing face descriptors...</p>
                    </motion.div>
                  )}

                  {/* 4. Complete mode */}
                  {(bioState === "completed" || (profile?.faceRegistered && bioState === "idle")) && (
                    <motion.div key="comp" className="text-center p-4 z-10 space-y-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl shadow-sm">
                      <CheckCircle size={28} className="text-emerald-500 mx-auto animate-pulse" />
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-emerald-500 font-bold">Biometrics Active</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-450">Registered: {profile?.faceRegistrationDate || "Today"}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Wireframe face guidelines visible during scanning */}
                {bioState === "preparing" && (
                  <>
                    <div className="absolute h-40 w-40 rounded-full border border-dashed border-primary/40 flex items-center justify-center animate-pulse pointer-events-none" />
                    <div className="scanner-line pointer-events-none" />
                  </>
                )}
              </div>

              {/* REGISTER BUTTON */}
              <div>
                {profile?.faceRegistered ? (
                  <Button
                    onClick={handleRegisterFace}
                    variant="outline"
                    size="sm"
                    className="w-full text-slate-450 border-slate-205 dark:border-slate-800 font-bold text-xs rounded-xl"
                  >
                    Re-enroll Biometrics
                  </Button>
                ) : (
                  <Button
                    onClick={handleRegisterFace}
                    variant="primary"
                    size="sm"
                    className="w-full glow-primary font-bold text-xs rounded-xl"
                  >
                    Start Biometric Enrollment
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

      </motion.div>
    </ErrorBoundary>
  );
};

export default ProfilePage;
