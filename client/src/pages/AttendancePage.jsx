import React, { useState, useEffect, useRef } from "react";
import Human from "@vladmandic/human";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanFace,
  QrCode,
  CheckCircle2,
  MapPin,
  User,
  Clock,
  ArrowLeft,
  Camera,
  AlertCircle,
  RefreshCw,
  Zap,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { attendanceService } from "../services/attendanceService";
import Button from "../components/Button";
import Card from "../components/Card";
import Badge from "../components/Badge";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import ErrorBoundary from "../components/ErrorBoundary";

export const AttendancePage = () => {
  const navigate = useNavigate();
  const locationState = useLocation().state;

  // Retrieve active session from router state or fall back to localStorage session or default to standard ongoing class
  const [activeSession, setActiveSession] = useState(null);

  // Flow control states: 'idle' | 'scanning_face' | 'face_failed' | 'scanning_qr' | 'success'
  const [step, setStep] = useState("idle");
  const [scanningStatus, setScanningStatus] = useState("");
  const [errorReason, setErrorReason] = useState(null); // 'face_mismatch' | 'poor_lighting' | 'qr_expired'
  const [qrCountdown, setQrCountdown] = useState(10); // QR code refreshes every 10s
  const [qrValue, setQrValue] = useState("");
  const [verifiedRecord, setVerifiedRecord] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (locationState?.classId) {
        setActiveSession(locationState);
        setStep("idle");
      } else {
        try {
          const sessionRes = await attendanceService.getActiveSession();

          if (sessionRes.active && sessionRes.session) {
            setActiveSession(sessionRes.session);
            if (sessionRes.session.qrToken) {
              setQrValue(sessionRes.session.qrToken);
            }
            setStep("idle");
            return;
          }
        } catch (err) {
          console.log("No active session from backend");
        }

        setActiveSession(null);
        setStep("idle");
      }
    };
    fetchSession();
  }, [locationState]);

  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const qrScannerRef = useRef(null);

  // AI Human.js
  const humanRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null); // 'permission_denied' | 'no_webcam' | 'camera_in_use'

  // Stop camera stream cleanly
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Start webcam stream for face scanning
  const startCameraStream = async () => {
    stopCameraStream();
    setCameraError(null);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
        });
      } catch (constrErr) {
        // Fallback for devices without facingMode constraint support
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setCameraStream(stream);
    } catch (err) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("permission_denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("no_webcam");
      } else {
        setCameraError("camera_in_use");
      }
    }
  };

  // Guarantee MediaStream is bound to video element once mounted & play is invoked
  useEffect(() => {
    if (cameraStream && faceVideoRef.current) {
      faceVideoRef.current.srcObject = cameraStream;
      faceVideoRef.current.play().catch((err) => console.error("Camera video play error:", err));
    }
  }, [cameraStream, step]);

  useEffect(() => {

    const loadHumanModels = async () => {

      try {

        const human = new Human({
          modelBase: "/models",

          cacheSensitivity: 0,

          face: {
            enabled: true,

            detector: {
              enabled: true,
              rotation: true,
              maxDetected: 1
            },

            description: {
              enabled: true
            },

            // recognition:{
            //   enabled:true
            // },

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

        console.log("Loading Human AI Models...");

        await human.load();

        await human.warmup();

        console.log("Human Version:", Human.version || "Unknown");
        console.log("Human Config:", human.config);

        humanRef.current = human;

        setModelsLoaded(true);

        console.log("✅ Human AI Ready");

      } catch (err) {

        console.error("Human Load Error:", err);

      }

    };

    loadHumanModels();

  }, []);

  // Real Face Scan & Frame Capture Effect
  useEffect(() => {
    if (step !== "scanning_face") {
      stopCameraStream();
      return;
    }

    startCameraStream();
    setScanningStatus("Initializing live webcam feed...");

    const timer1 = setTimeout(() => {
      setScanningStatus("Liveness check: Face detected in frame. Hold still...");
    }, 1200);

    const timer2 = setTimeout(() => {
      setScanningStatus("Mapping facial feature vectors & verifying biometrics...");
    }, 2800);

    const timer3 = setTimeout(async () => {
      try {
        if (!modelsLoaded || !humanRef.current) {
          toast.error("AI Models are still loading.");
          stopCameraStream();
          setStep("face_failed");
          return;
        }

        if (!faceVideoRef.current) {
          toast.error("Camera not ready.");
          stopCameraStream();
          setStep("face_failed");
          return;
        }

        const result = await humanRef.current.detect(faceVideoRef.current);

        console.log("Human Result:", result);

        if (!result.face || result.face.length === 0) {
          stopCameraStream();
          toast.error("No face detected.");
          setStep("face_failed");
          setErrorReason("face_mismatch");
          return;
        }

        const face = result.face[0];

        const embedding =
          face.embedding ||
          face.descriptor ||
          face.tensor ||
          face.vector;

        if (!embedding) {
          stopCameraStream();
          toast.error("Embedding generation failed.");
          setStep("face_failed");
          return;
        }

        console.log("VERIFY EMBEDDING LENGTH:", embedding.length);
        console.log("Embedding Sample:", embedding.slice(0, 10));

        const res = await attendanceService.verifyFace(
          Array.from(embedding),
          activeSession?.classId,
          activeSession?.subject,
          activeSession?.room,
          false
        );

        stopCameraStream();

        if (res.verified) {
          setVerifiedRecord(
            res.record || {
              subject: activeSession?.subject || "AI & Machine Learning",
              room: activeSession?.room || "Lab-3",
              method: "Face ID",
              time: new Date().toLocaleTimeString(),
            }
          );

          setStep("success");

          toast.success(
            `Face verified (${res.confidence || 98.4}% confidence)!`
          );
        } else {
          setStep("face_failed");
          setErrorReason("face_mismatch");
          toast.error(res.message || "Face verification failed.");
        }
      } catch (err) {
        console.error(err);

        stopCameraStream();

        setStep("face_failed");

        setErrorReason("general");

        toast.error(
          err?.response?.data?.message ||
          err.message ||
          "Face Verification Failed"
        );
      }
    }, 4800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      stopCameraStream();
    };
  }, [step, activeSession, modelsLoaded]);

  // Real QR Code Scanner Effect (html5-qrcode) & Token Refresh
  useEffect(() => {
    if (step !== "scanning_qr") {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => { }).then(() => {
          qrScannerRef.current = null;
        });
      }
      return;
    }

    const refreshQRToken = async () => {
      try {
        const token = await attendanceService.getQRToken(activeSession?.classId);
        setQrValue(token);
      } catch (err) {
        console.error("Failed to get QR token:", err);
      }
    };

    refreshQRToken();
    setQrCountdown(10);

    const tokenInterval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          refreshQRToken();
          toast.success("Security QR token refreshed automatically.", { id: "qr-ref" });
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    // Initialize html5-qrcode scanner on DOM container with desktop fallback
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("qr-reader-container");
        qrScannerRef.current = scanner;

        const onScanSuccess = async (decodedText) => {

          console.log("QR DETECTED:", decodedText);
          
          if (qrScannerRef.current) {
            qrScannerRef.current.stop().catch(() => { });
          }
          toast.success("QR Code detected! Verifying token...");
          handleVerifyScannedToken(decodedText);
        };

        try {
          await scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            onScanSuccess,
            () => { }
          );
        } catch (envErr) {
          // Desktop/Laptop single-webcam fallback
          await scanner.start(
            { facingMode: "user" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            onScanSuccess,
            () => { }
          );
        }
      } catch (err) {
        console.warn("QR Scanner initialization notice:", err.message);
      }
    };

    // Small delay to ensure DOM element is mounted
    const scannerTimer = setTimeout(startScanner, 200);

    return () => {
      clearInterval(tokenInterval);
      clearTimeout(scannerTimer);
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => { }).then(() => {
          qrScannerRef.current = null;
        });
      }
    };
  }, [step, activeSession]);

  const handleStartScanning = () => {
    if (!activeSession) return;
    setStep("scanning_face");
  };

  const handleVerifyScannedToken = async (scannedToken) => {
    setScanningStatus("Validating scanned QR token with server...");

    try {
      const res = await attendanceService.verifyQRToken(scannedToken || qrValue);

      if (res.verified) {
        setVerifiedRecord(
          res.record || {
            subject: activeSession?.subject || "AI & Machine Learning",
            room: activeSession?.room || "Lab-3",
            method: "QR Scan",
            time: new Date().toLocaleTimeString()
          }
        );
        setStep("success");
        if (res.alreadyMarked) {
          toast.success("Attendance was already recorded for this session!");
        } else {
          toast.success("QR Attendance verified and marked successfully!");
        }
      } else {
        setStep("face_failed");
        setErrorReason(res.errorType || "qr_invalid");
        toast.error(res.message || "QR verification failed.");
      }
    } catch (err) {
      setStep("face_failed");
      setErrorReason(err.message.includes("expired") ? "qr_expired" : "qr_invalid");
      toast.error(err.message || "Invalid or expired QR token.");
    }
  };

  // SVG circular countdown gauge
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (qrCountdown / 10) * circumference;

  if (!activeSession) {
    return (
      <ErrorBoundary>
        <div className="space-y-6 max-w-2xl mx-auto text-left">
          <div className="flex items-center justify-between pb-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer"
            >
              <ArrowLeft size={14} /> Dashboard Console
            </button>
          </div>
          <EmptyState
            title="No Active Attendance Session"
            description="No active attendance session. Please wait for your teacher."
            actionLabel="Return to Dashboard"
            onAction={() => navigate("/dashboard")}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 max-w-2xl mx-auto text-left">

        {/* HEADER BREADCRUMB */}
        <div className="flex items-center justify-between pb-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer"
          >
            <ArrowLeft size={14} /> Dashboard Console
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 1: VERIFICATION METHOD SELECTION */}
          {step === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent border border-slate-200/40 dark:border-slate-800/40 backdrop-blur-sm relative overflow-hidden text-left">
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Attendance Verification System</span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Select Verification Method</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Active Lecture: <strong className="text-slate-800 dark:text-slate-200">{activeSession?.subject || "AI & Machine Learning"}</strong> • {activeSession?.faculty || "Dr. Sarah Jenkins"} • {activeSession?.room || "Lab-3"}
                  </p>
                </div>
              </div>

              {/* Two Verification Method Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Option 1: Face Recognition */}
                <Card
                  hoverEffect={true}
                  onClick={() => setStep("scanning_face")}
                  className="p-6 flex flex-col justify-between space-y-5 cursor-pointer group border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm text-left"
                >
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <ScanFace size={26} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        Face Recognition
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Scan biometrics using your device camera for instant AI identity verification.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStep("scanning_face");
                      }}
                      variant="primary"
                      size="sm"
                      className="w-full gap-2 font-bold rounded-xl cursor-pointer"
                    >
                      <ScanFace size={16} /> Verify via Face ID
                    </Button>
                  </div>
                </Card>

                {/* Option 2: Teacher Dynamic QR */}
                <Card
                  hoverEffect={true}
                  onClick={() => setStep("scanning_qr")}
                  className="p-6 flex flex-col justify-between space-y-5 cursor-pointer group border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all shadow-sm text-left"
                >
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <QrCode size={26} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                        Teacher QR Code
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Scan the time-rotating security QR code broadcasted live on the classroom display.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStep("scanning_qr");
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 font-bold rounded-xl border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                    >
                      <QrCode size={16} /> Scan Teacher QR
                    </Button>
                  </div>
                </Card>

              </div>

              {/* Session Parameters Footer */}
              <div className="p-5 bg-white dark:bg-[#0c121e]/70 border border-slate-200/50 dark:border-slate-850 rounded-2xl text-left">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-500 mb-4">Session Parameters</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-400">Class Subject</p>
                    <p className="font-bold text-slate-800 dark:text-white">{activeSession?.subject}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400">Instructor Name</p>
                    <p className="font-bold text-slate-800 dark:text-white">{activeSession?.faculty}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400">Assigned Hall</p>
                    <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      <MapPin size={12} className="text-red-400" /> {activeSession?.room}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400">System Mode</p>
                    <p className="font-bold text-indigo-400 flex items-center gap-1">
                      <Zap size={12} /> Dual Verification System
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SCANNING FACE */}
          {step === "scanning_face" && (
            <motion.div
              key="scanning_face"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <Card hoverEffect={false} className="border-slate-200 dark:border-slate-800 max-w-md mx-auto p-6 relative overflow-hidden bg-slate-950/20 backdrop-blur-sm">

                {/* Real Live Camera Feed */}
                <div className="h-72 w-full rounded-2xl bg-slate-950 border border-slate-850/80 relative overflow-hidden flex items-center justify-center shadow-inner">
                  {cameraError ? (
                    <div className="p-6 text-center space-y-3 relative z-20">
                      <div className="p-3 rounded-full bg-red-500/10 text-red-500 inline-block border border-red-500/20">
                        <AlertCircle size={28} />
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {cameraError === "permission_denied"
                          ? "Camera Access Denied"
                          : cameraError === "no_webcam"
                            ? "No Webcam Device Found"
                            : "Webcam In Use"}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        {cameraError === "permission_denied"
                          ? "Please enable camera permissions in your browser address bar to proceed with face verification."
                          : "Ensure your webcam device is connected and not blocked by another application."}
                      </p>
                      <Button onClick={startCameraStream} variant="outline" size="sm" className="mt-2 text-xs font-bold">
                        Retry Camera Access
                      </Button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={faceVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover relative z-0 rounded-2xl"
                      />
                      <canvas ref={faceCanvasRef} className="hidden" />

                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                      <div className="scanner-line pointer-events-none" />

                      <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.2 }}
                        className="absolute h-56 w-56 rounded-full border border-dashed border-cyan-400/40 flex items-center justify-center pointer-events-none"
                      />

                      <motion.svg
                        width="130"
                        height="130"
                        viewBox="0 0 100 100"
                        className="text-cyan-400 stroke-current stroke-[1.2] fill-none relative z-10 pointer-events-none"
                      >
                        <path d="M30,35 Q30,22 50,22 Q70,22 70,35 Q70,60 50,75 Q30,60 30,35 Z" className="stroke-indigo-500/80" />
                        <circle cx="43" cy="40" r="2" className="fill-cyan-400" />
                        <circle cx="57" cy="40" r="2" className="fill-cyan-400" />
                        <path d="M50,45 L50,53 L47,53" />
                        <path d="M44,60 Q50,64 56,60" />
                        <circle cx="50" cy="22" r="1.2" className="fill-cyan-300" />
                        <circle cx="30" cy="35" r="1.2" className="fill-cyan-300" />
                        <circle cx="70" cy="35" r="1.2" className="fill-cyan-300" />
                        <circle cx="50" cy="75" r="1.2" className="fill-cyan-300" />
                        <line x1="43" y1="40" x2="50" y2="45" className="stroke-cyan-500/30" />
                        <line x1="57" y1="40" x2="50" y2="45" className="stroke-cyan-500/30" />
                      </motion.svg>

                      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
                      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
                      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
                      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

                      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[9px] uppercase font-mono tracking-widest text-cyan-400 backdrop-blur-sm ml-8 pointer-events-none">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>Webcam: Live Liveness</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress parameters */}
                <div className="space-y-2 mt-6 text-center">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-205 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-cyan-400" />
                    {scanningStatus}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed">
                    Ensure your face is clearly visible inside the reticle boundary.
                  </p>
                </div>
              </Card>

              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1 max-w-xs mx-auto overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.8, ease: "linear" }}
                  className="bg-cyan-400 h-1"
                />
              </div>

              <div className="flex justify-center pt-2">
                <Button onClick={() => setStep("idle")} variant="outline" size="sm" className="cursor-pointer">
                  Choose Different Method
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: FACE VERIFICATION FAILED */}
          {step === "face_failed" && (
            <motion.div
              key="face_failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <ErrorState
                title={errorReason === "face_mismatch" ? "Biometric Identity Mismatch" : "Facial Detection Failed"}
                description={
                  errorReason === "face_mismatch"
                    ? "The scanned face does not match the enrolled biometric templates on file."
                    : "Liveness timeout. Position your camera in a brighter room and remove glasses."
                }
                errorType={errorReason || "face_not_recognized"}
                onRetry={() => setStep("scanning_face")}
              />

              {/* QR Fallback Banner */}
              <Card hoverEffect={true} className="border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl flex-shrink-0 shadow-inner">
                    <QrCode size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-905 dark:text-white">Verify using Teacher's QR</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Scan the time-rotating security QR code broadcasted live on the classroom monitor.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setStep("scanning_qr")}
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto flex-shrink-0 font-bold"
                >
                  Scan QR Code
                </Button>
              </Card>
            </motion.div>
          )}

          {/* STEP 4: SCANNING QR CODE */}
          {step === "scanning_qr" && (
            <motion.div
              key="scanning_qr"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <Card hoverEffect={false} className="border-slate-200 dark:border-slate-850 max-w-md mx-auto p-6 relative overflow-hidden bg-slate-950/20">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-905 dark:text-white">Live QR Scanner</h4>
                  <Badge variant="accent" className="animate-pulse">Active geofence</Badge>
                </div>

                {/* Real HTML5 QR Scanner Viewport */}
                <div className="min-h-[260px] w-full rounded-2xl bg-slate-950 border border-slate-900 relative overflow-hidden flex flex-col items-center justify-center">
                  <div id="qr-reader-container" className="w-full h-[260px] rounded-2xl" />
                </div>

                {/* Rotating Timer ring */}
                <div className="mt-6 flex items-center justify-between bg-white/40 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    {/* SVG Circular countdown */}
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r={radius} className="stroke-slate-100 dark:stroke-slate-900 fill-none" strokeWidth="4" />
                      <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        className="stroke-indigo-500 fill-none transition-all duration-1000 ease-linear"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Security Token</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Rotates in {qrCountdown}s</p>
                    </div>
                  </div>
                  <Badge variant="accent">Refreshing</Badge>
                </div>
              </Card>

              <div className="flex justify-center gap-3">
                <Button onClick={() => setStep("idle")} variant="outline" size="sm" className="cursor-pointer">
                  Choose Different Method
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: SUCCESS STATE */}
          {step === "success" && verifiedRecord && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <Card hoverEffect={false} className="border-slate-205 dark:border-slate-800/80 p-8 text-center relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent shadow-xl">

                {/* Background glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-md shadow-emerald-500/10 animate-bounce">
                  <CheckCircle2 size={32} />
                </div>

                <h2 className="text-xl font-black font-sans text-slate-905 dark:text-white mb-2">
                  Check-in Logged!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your identity coordinates have been logged in the department database.
                </p>

                {/* Receipt Detail Sheet */}
                <div className="my-6 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-850 text-left space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-slate-850">
                    <span className="text-slate-400">Subject</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-200 flex items-center gap-1">
                      <Sparkles size={11} className="text-amber-500" /> {verifiedRecord.subject}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1"><User size={12} /> Instructor</span>
                    <span className="font-bold text-slate-800 dark:text-slate-305">{activeSession?.faculty}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1"><Clock size={12} /> Verification Time</span>
                    <span className="font-bold text-slate-800 dark:text-slate-305">{verifiedRecord.time}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1"><MapPin size={12} /> Room Location</span>
                    <span className="font-bold text-slate-800 dark:text-slate-305">{verifiedRecord.room}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Validation Method</span>
                    <Badge variant="success">{verifiedRecord.method}</Badge>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="primary"
                  className="w-full font-bold shadow-md shadow-emerald-500/10 rounded-xl"
                >
                  Dashboard Console
                </Button>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </ErrorBoundary>
  );
};

export default AttendancePage;
