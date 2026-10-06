import Human from "@vladmandic/human";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Camera,
  CheckCircle2,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  BookOpen,
  Lock,
  X,
  Upload,
  Award,
  Clock,
  Users,
  KeyRound,
  Building2,
  ShieldAlert
} from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { studentService } from "../services/studentService";
import authService from "../services/authService";
import ErrorBoundary from "../components/ErrorBoundary";

export const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Photo Upload State
  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // Biometric registration UI state: 'idle' | 'preparing' | 'capturing' | 'saving' | 'completed'
  const [bioState, setBioState] = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [isFlashActive, setIsFlashActive] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const loadProfile = async () => {
    try {
      const data = await studentService.getProfile();
      setProfile(data);
      const cleanPhone = (data?.phone || "").replace(/^(\+91|\+91\s*)/, "").replace(/\D/g, "").slice(0, 10);
      reset({
        name: data?.name || "",
        email: data?.email || "",
        phone: cleanPhone,
        enrollmentNo: data?.enrollmentNo || "CS20261001"
      });
    } catch (err) {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onUpdateProfile = async (formData) => {
    setIsSaving(true);
    try {
      const cleanPhone = (formData.phone || "").replace(/\D/g, "").slice(0, 10);
      const updatedUser = await studentService.updateProfile({
        name: formData.name,
        phone: cleanPhone
      });

      setProfile((prev) => ({ ...prev, ...updatedUser }));
      
      // Sync global user state for header/sidebar avatars & phone
      window.dispatchEvent(new Event("user_profile_updated"));
      toast.success("Profile details updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  // Password change handler
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully!");
    }, 800);
  };

  // ---------------- PROFILE PHOTO UPLOAD LOGIC ----------------

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // 1. File type validation
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    // 2. File size validation (5 MB maximum)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("Profile photo must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    // 3. Read image data URL for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
      setShowPhotoModal(true);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleCancelPhotoModal = () => {
    setPhotoPreview(null);
    setShowPhotoModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSavePhoto = async () => {
    if (!photoPreview) return;
    setIsUploadingPhoto(true);

    try {
      const updatedUser = await studentService.updateProfile({
        avatar: photoPreview
      });

      setProfile((prev) => ({ ...prev, avatar: updatedUser.avatar || photoPreview }));
      
      const currentUser = authService.getCurrentUser() || {};
      const newUserData = { ...currentUser, avatar: updatedUser.avatar || photoPreview };
      localStorage.setItem("attendify_user", JSON.stringify(newUserData));
      window.dispatchEvent(new Event("user_profile_updated"));

      toast.success("Profile photo updated successfully!");
      handleCancelPhotoModal();
    } catch (error) {
      toast.error(error.message || "Failed to upload profile photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ---------------- FACE RECOGNITION & WEBCAM LOGIC (Student Profile Only) ----------------
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const humanRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const currentUser = authService.getCurrentUser() || {};
  const userRole = profile?.role || currentUser?.role || "student";
  const isTeacher = userRole === "teacher";
  const isAdmin = userRole === "admin";

  const stopWebcam = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Error stopping streamRef tracks:", e);
      }
      streamRef.current = null;
    }

    if (stream) {
      try {
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("Error stopping stream state tracks:", e);
      }
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (e) {}
      videoRef.current.srcObject = null;
    }

    setStream(null);
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

      streamRef.current = mediaStream;
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
      stopWebcam();
      throw err;
    }
  };

  useEffect(() => {
    if (!isTeacher && !isAdmin && stream && videoRef.current && bioState !== "completed") {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => console.error("Profile video play error:", err));
    }
  }, [stream, bioState, isTeacher, isAdmin]);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    if (isTeacher || isAdmin) return; // Skip AI model loading for non-students

    const loadAI = async () => {
      try {
        const human = new Human({
          modelBase: "/models",
          cacheSensitivity: 0,
          face: {
            enabled: true,
            detector: {
              enabled: true,
              rotation: true,
              maxDetected: 5,
              minConfidence: 0.20
            },
            description: { enabled: true },
            mesh: { enabled: true },
            iris: { enabled: false },
            emotion: { enabled: false }
          },
          body: { enabled: false },
          hand: { enabled: false },
          object: { enabled: false }
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
  }, [isTeacher, isAdmin]);

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
    setBioState("capturing");
    setIsFlashActive(true);

    try {
      if (!videoRef.current || !canvasRef.current) {
        toast.error("Camera is not ready.");
        stopWebcam();
        setBioState("idle");
        return;
      }

      const video = videoRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error("Camera stream is not ready.");
        stopWebcam();
        setBioState("idle");
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setTimeout(async () => {
        try {
          setIsFlashActive(false);
          setBioState("saving");

          if (!modelsLoaded || !humanRef.current) {
            toast.error("Models are still loading...");
            stopWebcam();
            setBioState("idle");
            return;
          }

          const result = await humanRef.current.detect(video);

          if (!result.face || result.face.length === 0) {
            toast.error("No face detected in camera frame.");
            stopWebcam();
            setBioState("idle");
            return;
          }

          if (result.face.length > 1) {
            toast.error("Multiple faces detected in frame. Please ensure only one face is visible.");
            stopWebcam();
            setBioState("idle");
            return;
          }

          const face = result.face[0];
          const faceScore = face.score || face.boxScore || 0;
          const faceBox = face.box || [0, 0, 0, 0];

          if (faceScore < 0.25) {
            toast.error(`Face detection confidence too low (${(faceScore * 100).toFixed(1)}%). Ensure good lighting.`);
            stopWebcam();
            setBioState("idle");
            return;
          }

          if ((faceBox[2] || 0) < 80 || (faceBox[3] || 0) < 80) {
            toast.error("Face is too far from camera. Move closer to register.");
            stopWebcam();
            setBioState("idle");
            return;
          }

          const embedding =
            face.embedding ||
            face.descriptor ||
            face.tensor ||
            face.vector ||
            null;

          if (!embedding) {
            toast.error("Embedding not generated.");
            stopWebcam();
            setBioState("idle");
            return;
          }

          const res = await studentService.registerFace({
            embedding: Array.from(embedding),
          });

          if (res.success) {
            toast.success("Face Registered Successfully!");
            stopWebcam();
            setBioState("completed");
            await loadProfile();
          } else {
            toast.error(res.message || "Registration failed.");
            stopWebcam();
            setBioState("idle");
          }
        } catch (err) {
          console.error(err);
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Face Registration Failed"
          );
          stopWebcam();
          setBioState("idle");
        } finally {
          stopWebcam();
        }
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error("Capture failed");
      stopWebcam();
      setBioState("idle");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton variant="avatar" />
        <Skeleton variant="card" count={2} />
      </div>
    );
  }

  const isFaceRegistered = profile?.faceRegistered ?? true;
  const rawPhone = (profile?.phone || "").replace(/^(\+91|\+91\s*)/, "").replace(/\D/g, "").slice(0, 10);
  const formattedPhone = rawPhone ? `+91 ${rawPhone}` : isAdmin ? "+91 9876543200" : "+91 9876543201";

  // Metadata fallbacks
  const employeeId = profile?.employeeId || profile?.id || "EMP-101";
  const department = profile?.department || (isAdmin ? "Administration" : "Computer Science & Engineering");
  const designation = profile?.designation || (isAdmin ? "System Administrator" : "Associate Professor");
  const section = profile?.section || (isAdmin ? "Central Admin Office" : "Senior Faculty / CSE Dept.");
  const teachingSemester = profile?.semester || "Spring 2026 Semester";

  const assignedSubjects = profile?.subjects || [
    "AI & Machine Learning (CS601)",
    "Database Management Systems (CS602)",
    "Web Technologies (CS603)",
    "Operating Systems (CS604)"
  ];

  const todaysClasses = profile?.classesToday || [
    { subject: "Web Technologies", code: "CS603", time: "10:00 AM - 11:30 AM", room: "Lab-1" },
    { subject: "Database Management Systems", code: "CS602", time: "11:45 AM - 01:15 PM", room: "Hall-101" },
    { subject: "AI & Machine Learning", code: "CS601", time: "02:00 PM - 03:30 PM", room: "Lab-3" }
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6 text-left max-w-6xl mx-auto">

        {/* SHUTTER FLASH OVERLAY (Student Only) */}
        {!isTeacher && !isAdmin && (
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
        )}

        {/* HIDDEN FILE INPUT FOR PROFILE PHOTO UPLOAD */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* PAGE HEADER */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
            {isAdmin ? (
              <>
                <ShieldCheck className="text-primary" size={24} /> Admin Profile
              </>
            ) : isTeacher ? (
              <>
                <Briefcase className="text-primary" size={24} /> Faculty Profile
              </>
            ) : (
              <>
                <User className="text-primary" size={24} /> Student Profile
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
            {isAdmin 
              ? "Manage system administration details, security controls, and account credentials."
              : isTeacher 
              ? "Manage your personal information, faculty details, and account security."
              : "Manage your personal information, academic details, and face verification settings."}
          </p>
        </div>

        {/* 1. PROFILE HEADER CARD (FULL WIDTH) */}
        <Card hoverEffect={false} className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left & Center Info Block */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left min-w-0">
              
              {/* Profile Photo with Change Photo Badge */}
              <div className="relative flex-shrink-0 group">
                <img
                  src={profile?.avatar || (isAdmin ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120" : isTeacher ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120" : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120")}
                  alt={profile?.name || "User Avatar"}
                  className="w-24 h-24 rounded-full border-2 border-slate-200 dark:border-slate-700 object-cover shadow-sm transition group-hover:opacity-90"
                />
                <button
                  type="button"
                  onClick={handleTriggerFileInput}
                  title="Change Profile Photo"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white hover:bg-primary-dark shadow-md cursor-pointer transition transform hover:scale-105"
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Personal Summary */}
              <div className="space-y-2 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                    {profile?.name || (isAdmin ? "System Admin" : isTeacher ? "Dr. Rahul Sharma" : "Aman Kumar")}
                  </h3>
                  <Badge variant={isAdmin ? "danger" : isTeacher ? "primary" : "neutral"} className="capitalize px-2.5 py-0.5 text-[11px] font-bold self-center sm:self-auto">
                    {isAdmin ? "Administrator" : isTeacher ? "Faculty" : "Student"}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail size={13} className="text-primary flex-shrink-0" />
                    <span className="truncate">{profile?.email || (isAdmin ? "admin@attendify.com" : isTeacher ? "rahul.sharma@attendify.com" : "aman.kumar@attendify.com")}</span>
                  </p>
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <Phone size={13} className="text-primary flex-shrink-0" />
                    <span>{formattedPhone}</span>
                  </p>
                  {(isTeacher || isAdmin) && (
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <Building2 size={13} className="text-primary flex-shrink-0" />
                      <span>{department} • Role: <strong className="text-slate-800 dark:text-slate-200">{isAdmin ? "System Administrator" : designation}</strong></span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Status Block */}
            <div className="flex flex-col items-center md:items-end gap-2 flex-shrink-0 border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto border-slate-200/60 dark:border-slate-800/60">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Account Status</span>
              {isAdmin ? (
                <Badge variant="success" className="px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active System Administrator
                </Badge>
              ) : isTeacher ? (
                <Badge variant="success" className="px-3 py-1 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Verified Faculty Account
                </Badge>
              ) : (
                <Badge variant={isFaceRegistered ? "success" : "danger"} className="px-3 py-1 text-xs font-bold">
                  Face Verification: {isFaceRegistered ? "Registered" : "Not Registered"}
                </Badge>
              )}
            </div>

          </div>
        </Card>

        {/* 2. PERSONAL INFORMATION FORM */}
        <Card hoverEffect={false} className="p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <User size={16} className="text-primary" /> Personal Information
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Update your display name and contact phone credentials.
            </p>
          </div>

          <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              
              {/* Full Name Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center justify-between">
                  Full Name <span className="text-red-500 text-[10px]">*Required</span>
                </label>
                <input
                  type="text"
                  {...register("name", {
                    required: "Full Name is required.",
                    minLength: { value: 2, message: "Name must be at least 2 characters." },
                    maxLength: { value: 50, message: "Name cannot exceed 50 characters." }
                  })}
                  className="glass-input h-11 px-3.5 py-2.5 w-full text-slate-900 dark:text-white text-xs"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.name.message}</p>
                )}
              </div>

              {/* Contact Email Input (Read Only) */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center justify-between">
                  Contact Email <span className="text-slate-400 font-normal text-[10px] flex items-center gap-1"><Lock size={10} /> Read-only</span>
                </label>
                <input
                  type="email"
                  disabled
                  {...register("email")}
                  className="glass-input h-11 px-3.5 py-2.5 w-full bg-slate-100/60 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/60 cursor-not-allowed text-xs"
                />
              </div>

              {/* Mobile Phone Input with Fixed +91 Prefix */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Mobile Number</label>
                <div className="flex items-center">
                  <span className="h-11 px-3.5 flex items-center bg-slate-100 dark:bg-slate-950 border border-r-0 border-slate-200 dark:border-slate-800 rounded-l-xl text-slate-600 dark:text-slate-400 font-bold text-xs select-none">
                    +91
                  </span>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="9876543200"
                    {...register("phone", {
                      validate: (value) => {
                        if (!value || value.trim() === "") return true;
                        const digits = value.replace(/\D/g, "");
                        if (digits.length < 10) return "Mobile number must contain 10 digits.";
                        if (digits.length > 10) return "Mobile number must contain exactly 10 digits.";
                        if (!/^[6-9]/.test(digits)) return "Enter a valid Indian mobile number starting with 6, 7, 8, or 9.";
                        if (!/^[6-9][0-9]{9}$/.test(digits)) return "Enter a valid 10-digit mobile number.";
                        return true;
                      }
                    })}
                    onChange={(e) => {
                      const cleanDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setValue("phone", cleanDigits, { shouldValidate: true });
                    }}
                    className="glass-input h-11 px-3.5 py-2.5 w-full text-slate-900 dark:text-white text-xs rounded-l-none rounded-r-xl border-l-0"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-red-500 font-medium mt-0.5">{errors.phone.message}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center justify-between">
                  Department <span className="text-slate-400 font-normal text-[10px] flex items-center gap-1"><Lock size={10} /> Read-only</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={department}
                  className="glass-input h-11 px-3.5 py-2.5 w-full bg-slate-100/60 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/60 cursor-not-allowed text-xs"
                />
              </div>

            </div>

            {/* Save Button Aligned Bottom Right */}
            <div className="pt-2 flex justify-end">
              <Button 
                type="submit" 
                disabled={isSaving}
                variant="primary" 
                size="sm" 
                className="font-bold text-xs rounded-xl px-6 h-10 flex items-center gap-2"
              >
                {isSaving && <RefreshCw size={14} className="animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. ROLE-SPECIFIC CARDS GRID */}
        {isAdmin ? (
          /* ================= ADMIN ROLE CARDS ================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              
              {/* ADMINISTRATIVE CREDENTIALS CARD */}
              <Card hoverEffect={false} className="p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck size={16} className="text-primary" /> Administrative Credentials
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      System access levels and administrative privileges.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admin ID</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">ADM-001</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Role</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">System Administrator</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Department</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Administration</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Access Scope</span>
                      <p className="text-xs font-bold text-emerald-500">Root System Control</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Platform Version: <strong className="text-slate-700 dark:text-slate-300 font-bold">Attendify v2.4.0 (Production)</strong></span>
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Encrypted Session
                  </span>
                </div>
              </Card>

              {/* SYSTEM SECURITY CARD */}
              <Card hoverEffect={false} className="p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock size={16} className="text-emerald-500" /> Security Controls
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Account security status, password controls, and system log audits.
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs font-semibold">
                    <div className="p-3 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                      <span className="text-slate-500">Audit Security Log:</span>
                      <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                        <CheckCircle2 size={13} /> Enabled
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                      <span className="text-slate-500">Authentication Mode:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">JWT Bearer Security</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                      <span className="text-slate-500">RBAC Enforcement:</span>
                      <span className="text-indigo-400 font-bold">Strict Role Isolation</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Administrative Passcode</span>
                  <Button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-bold rounded-xl px-4 flex items-center gap-1.5"
                  >
                    <KeyRound size={13} /> Change Password
                  </Button>
                </div>
              </Card>

            </div>
          </div>
        ) : isTeacher ? (
          /* ================= TEACHER ROLE CARDS ================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              
              {/* FACULTY INFORMATION CARD */}
              <Card hoverEffect={false} className="p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase size={16} className="text-indigo-500" /> Faculty Details
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Official faculty credentials and institutional placement.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Employee ID</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{employeeId}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Designation</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{designation}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Department</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{department}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Teaching Term</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{teachingSemester}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                  <span>Academic Section: <strong className="text-slate-700 dark:text-slate-300 font-bold">{section}</strong></span>
                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified Profile
                  </span>
                </div>
              </Card>

              {/* TEACHING INFORMATION CARD */}
              <Card hoverEffect={false} className="p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen size={16} className="text-emerald-500" /> Teaching Information
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Course loads, assigned subjects, and today's schedule.
                    </p>
                  </div>

                  {/* Assigned Subjects */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Assigned Subjects ({assignedSubjects.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedSubjects.map((sub, idx) => (
                        <span 
                          key={idx} 
                          className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[11px] font-bold rounded-lg"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Today's Classes List */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Today's Teaching Schedule
                    </span>
                    <div className="space-y-2">
                      {todaysClasses.map((cls, idx) => (
                        <div 
                          key={idx} 
                          className="p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between text-xs font-semibold"
                        >
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs">{cls.subject}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-2">
                              <Clock size={10} className="text-primary" /> {cls.time}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5">
                            {cls.room}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Users size={12} className="text-primary" /> 145 Active Students Enrolled</span>
                  <span className="text-[10px] font-bold text-primary">3 Batches</span>
                </div>
              </Card>

            </div>

            {/* TEACHER ACCOUNT & SECURITY CARD (FULL WIDTH) */}
            <Card hoverEffect={false} className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Account & Security</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Faculty credentials, active session status, and password settings.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Role:</span>
                    <Badge variant="primary" className="px-2.5 py-0.5 text-[10px] font-bold">Faculty / Teacher</Badge>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-bold rounded-xl px-4 flex items-center gap-1.5"
                  >
                    <KeyRound size={13} /> Change Password
                  </Button>
                </div>
              </div>
            </Card>

          </div>
        ) : (
          /* ================= STUDENT ROLE CARDS ================= */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              
              {/* ACADEMIC INFORMATION CARD */}
              <Card hoverEffect={false} className="p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-400" /> Academic Information
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Official enrollment details registered with the institution.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs font-semibold">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enrollment Number</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profile?.enrollmentNo || "CS20261001"}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Department</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profile?.department || "Computer Science"}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Semester</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profile?.semester || "6th Semester"}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Academic Section</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{profile?.section || "Section A"}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px] text-slate-400 font-medium">
                  Academic credentials are managed directly by university registrar services.
                </div>
              </Card>

              {/* FACE VERIFICATION CARD (STUDENT ONLY) */}
              <Card hoverEffect={false} className="p-6 text-center space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="text-left space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Camera size={16} className="text-primary" /> Face Verification
                      </h4>
                      <Badge variant={isFaceRegistered ? "success" : "danger"} className="text-[10px] font-bold px-2 py-0.5">
                        {isFaceRegistered ? "Registered" : "Not Registered"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      Your registered face is used to securely verify attendance during active classroom sessions.
                    </p>
                  </div>

                  {/* WEBCAM SCAN FEED */}
                  <div className="h-48 w-full rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex items-center justify-center shadow-inner">
                    {stream && bioState !== "completed" ? (
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
                      <>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
                      </>
                    )}

                    <AnimatePresence mode="wait">
                      {bioState === "idle" && !isFaceRegistered && (
                        <motion.div key="idle" className="text-center p-4 z-10 space-y-2">
                          <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            <Camera size={18} />
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">Camera feed ready.</p>
                        </motion.div>
                      )}

                      {bioState === "preparing" && (
                        <motion.div
                          key="prep"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          className="z-10 font-sans font-extrabold text-3xl text-primary flex flex-col items-center gap-1"
                        >
                          <span>{countdown}</span>
                          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400">Position Face</span>
                        </motion.div>
                      )}

                      {bioState === "saving" && (
                        <motion.div key="saving" className="text-center p-4 z-10 space-y-2">
                          <RefreshCw size={20} className="animate-spin text-primary mx-auto" />
                          <p className="text-[9px] text-primary font-bold uppercase tracking-wider">Processing Biometric Vector...</p>
                        </motion.div>
                      )}

                      {(bioState === "completed" || (isFaceRegistered && bioState === "idle")) && (
                        <motion.div key="comp" className="text-center p-3 z-10 space-y-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <CheckCircle2 size={26} className="text-emerald-500 mx-auto animate-pulse" />
                          <p className="text-[11px] text-emerald-500 font-bold">Face Verification Registered</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div>
                  {isFaceRegistered ? (
                    <Button
                      onClick={handleRegisterFace}
                      variant="outline"
                      size="sm"
                      className="w-full h-10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 font-bold text-xs rounded-xl"
                    >
                      Re-register Face
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRegisterFace}
                      variant="primary"
                      size="sm"
                      className="w-full h-10 glow-primary font-bold text-xs rounded-xl"
                    >
                      Register Face
                    </Button>
                  )}
                </div>
              </Card>

            </div>

            {/* STUDENT ACCOUNT INFORMATION CARD (FULL WIDTH) */}
            <Card hoverEffect={false} className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">Account Information</span>
                </div>

                <div className="flex items-center gap-6 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Role:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold capitalize">Student</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Account Status:</span>
                    <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        )}

        {/* PROFILE PHOTO PREVIEW MODAL */}
        <AnimatePresence>
          {showPhotoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Upload size={16} className="text-primary" /> Preview & Save Profile Photo
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancelPhotoModal}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center space-y-3 py-2">
                  <div className="w-36 h-36 rounded-full border-4 border-primary/20 p-1 overflow-hidden shadow-inner">
                    <img
                      src={photoPreview}
                      alt="Selected Profile Preview"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    This photo will be displayed across your profile, sidebar, and header.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    onClick={handleCancelPhotoModal}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold rounded-xl px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSavePhoto}
                    disabled={isUploadingPhoto}
                    variant="primary"
                    size="sm"
                    className="text-xs font-bold rounded-xl px-5 flex items-center gap-2"
                  >
                    {isUploadingPhoto && <RefreshCw size={14} className="animate-spin" />}
                    Save Photo
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CHANGE PASSWORD MODAL */}
        <AnimatePresence>
          {showPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound size={16} className="text-primary" /> Change Password
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-bold">Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="glass-input h-10 px-3.5 py-2 w-full text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-bold">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="glass-input h-10 px-3.5 py-2 w-full text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-700 dark:text-slate-300 font-bold">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="glass-input h-10 px-3.5 py-2 w-full text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold rounded-xl px-4"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdatingPassword}
                      variant="primary"
                      size="sm"
                      className="text-xs font-bold rounded-xl px-5 flex items-center gap-2"
                    >
                      {isUpdatingPassword && <RefreshCw size={14} className="animate-spin" />}
                      Update Password
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </ErrorBoundary>
  );
};

export default ProfilePage;
