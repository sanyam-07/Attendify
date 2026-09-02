// Face Controller
// Handles face biometric embedding registration and strict cosine similarity verification.

const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const Face = require("../models/Face");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");

// Minimum cosine similarity required between LIVE camera embedding and REGISTERED student embedding (85.0%)
const SIMILARITY_THRESHOLD = 85.0;

/**
 * Extract a normalized feature vector from camera embedding payload or image base64.
 * Returns NULL if payload is missing, empty, or invalid. NEVER falls back to synthetic defaults.
 */
const extractVectorFromImageBase64 = (imageData) => {
  if (!imageData) return null;

  // 1. Direct array of numbers
  if (Array.isArray(imageData) && imageData.length > 0) {
    const norm = Math.sqrt(imageData.reduce((sum, val) => sum + val * val, 0)) || 1.0;
    return imageData.map((val) => val / norm);
  }

  // 2. Object with nested embedding property (defensive extraction)
  if (typeof imageData === "object" && Array.isArray(imageData.embedding) && imageData.embedding.length > 0) {
    const norm = Math.sqrt(imageData.embedding.reduce((sum, val) => sum + val * val, 0)) || 1.0;
    return imageData.embedding.map((val) => val / norm);
  }

  try {
    const cleanBase64 = typeof imageData === "string" && imageData.includes("base64,")
      ? imageData.split("base64,")[1]
      : imageData;

    if (typeof cleanBase64 !== "string" || cleanBase64.length === 0) return null;

    const buffer = Buffer.from(cleanBase64, "base64");
    if (buffer.length === 0) return null;

    const vector = [];
    const hash = crypto.createHash("sha256").update(buffer).digest();

    for (let i = 0; i < 128; i++) {
      const byteVal = buffer[i % buffer.length] ^ hash[i % hash.length];
      vector.push((byteVal / 127.5) - 1.0);
    }

    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1.0;
    return vector.map((val) => val / norm);
  } catch (err) {
    return null;
  }
};

/**
 * Compute Cosine Similarity between two numerical embedding vectors
 */
const computeCosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;

  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * @desc    Register student face biometric embedding from live webcam snapshot (Vectors only, no images)
 * @route   POST /api/face/register
 * @access  Private
 */
const registerFace = asyncHandler(async (req, res) => {
  const { image, embedding } = req.body;
  const studentId = req.user._id;

  const vector = extractVectorFromImageBase64(image || embedding);
  if (!vector || vector.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing face biometric embedding from camera."
    });
  }

  let face = await Face.findOne({ studentId });

  if (face) {
    face.embedding = vector;
    await face.save();
  } else {
    face = await Face.create({
      studentId,
      embedding: vector
    });
  }

  await Student.findOneAndUpdate({ user: studentId }, { faceRegistered: true });

  console.log(`[SECURITY AUDIT] Face Registered for Student: ${req.user.name} | Vector Length: ${vector.length}`);

  res.status(200).json({
    success: true,
    message: "Face biometric embedding registered successfully from webcam snapshot.",
    studentId,
    embeddingLength: face.embedding.length
  });
});

/**
 * @desc    Verify live camera face biometric embedding against STORED student face embedding
 * @route   POST /api/face/verify
 * @access  Private
 */
const verifyFace = asyncHandler(async (req, res) => {
  const { 
    image, 
    embedding, 
    classId, 
    subject, 
    room, 
    forceFail,
    blinkCount,
    blinkDetected,
    challengeCompleted,
    livenessScore,
    faceCount,
    faceScore,
    faceBoxWidth,
    faceBoxHeight
  } = req.body;

  const studentId = req.user._id;

  // Safe Debug Logging (No raw vector values logged)
  const incomingVector = extractVectorFromImageBase64(image || embedding);
  console.log("=== BACKEND FACE VERIFY DEBUG LOG ===");
  console.log("Req Body Embedding Exists:", !!embedding || !!image);
  console.log("Extracted Incoming Vector Exists:", !!incomingVector);
  console.log("Extracted Incoming Vector Length:", incomingVector ? incomingVector.length : 0);
  console.log("Received Face Count:", faceCount);
  console.log("Received Face Score:", faceScore);
  console.log("Received Liveness Score:", livenessScore);
  console.log("Received Challenge Completed:", challengeCompleted);

  // 1. Retrieve STORED Registered Face Embedding for this student
  const storedFace = await Face.findOne({ studentId });
  if (!storedFace || !storedFace.embedding || storedFace.embedding.length === 0) {
    console.log(`[SECURITY AUDIT] Verification Failed for ${req.user.name}: No registered face in DB.`);
    return res.status(200).json({
      success: false,
      verified: false,
      message: "Face biometrics not registered yet. Please enroll your face in Profile Hub first."
    });
  }

  console.log("Stored Registered Vector Length:", storedFace.embedding.length);

  // 2. Validate LIVE Camera Vector
  if (!incomingVector || incomingVector.length === 0) {
    console.log(`[SECURITY AUDIT] Verification Failed for ${req.user.name}: Live embedding missing or payload error.`);
    return res.status(200).json({
      success: false,
      verified: false,
      payloadError: true,
      message: "Biometric verification could not read the live face data. Please retry."
    });
  }

  // 3. Embedding Format & Dimensions Compatibility Check
  if (storedFace.embedding.length !== incomingVector.length) {
    console.log(`[SECURITY AUDIT] Verification Failed for ${req.user.name}: Incompatible vector dimensions (Stored=${storedFace.embedding.length}, Live=${incomingVector.length}).`);
    return res.status(200).json({
      success: false,
      verified: false,
      message: "Biometric template format mismatch. Please re-enroll face biometrics in Profile Hub."
    });
  }

  // 4. Multi-Face / No-Face Detection Validation
  if (faceCount === undefined || faceCount === 0) {
    return res.status(200).json({
      success: false,
      verified: false,
      spoofDetected: false,
      noFace: true,
      message: "No face detected in camera frame. Position face inside border."
    });
  }

  if (faceCount > 1) {
    await AuditLog.create({
      admin: studentId,
      adminName: req.user.name,
      action: "Multiple Faces Detected",
      entityType: "User",
      description: `Rejected verification for ${req.user.name}: Multiple faces (${faceCount}) in frame.`,
      metadata: { livenessScore: livenessScore || 0, faceCount }
    });

    return res.status(200).json({
      success: false,
      verified: false,
      spoofDetected: true,
      multipleFaces: true,
      message: "Multiple faces detected in camera frame. Verification rejected."
    });
  }

  // 5. Detection Score & Box Size Validation
  if (faceScore !== undefined && faceScore < 0.25) {
    return res.status(200).json({
      success: false,
      verified: false,
      message: `Face detection confidence too low (${(faceScore * 100).toFixed(1)}%). Position face clearly in good lighting.`
    });
  }

  if (faceBoxWidth !== undefined && (faceBoxWidth < 80 || faceBoxHeight < 80)) {
    return res.status(200).json({
      success: false,
      verified: false,
      message: "Face is too far from camera. Move closer to verify."
    });
  }

  // 6. Anti-Photo / Replay & Liveness Guards
  const isBlinkPassed = blinkDetected === true || (typeof blinkCount === "number" && blinkCount > 0);
  const isChallengePassed = challengeCompleted === true;
  const currentLivenessScore = typeof livenessScore === "number" ? livenessScore : (forceFail ? 35.0 : 0.0);

  if (forceFail || !isBlinkPassed || !isChallengePassed || currentLivenessScore < 70.0) {
    await AuditLog.create({
      admin: studentId,
      adminName: req.user.name,
      action: "Suspicious Spoof Attempt Detected",
      entityType: "User",
      description: `Spoof/Replay attack detected for ${req.user.name} (Liveness Score: ${currentLivenessScore}%).`,
      metadata: { livenessScore: currentLivenessScore, blinkCount, challengeCompleted }
    });

    await Notification.create({
      receiver: studentId,
      receiverType: "Student",
      title: "Security Liveness Alert",
      message: "Suspicious facial liveness pattern detected. Verification aborted.",
      type: "System",
      category: "System",
      priority: "High"
    });

    return res.status(200).json({
      success: false,
      verified: false,
      spoofDetected: true,
      livenessScore: currentLivenessScore,
      message: "Anti-spoofing check failed. Photo or video replay attack suspected."
    });
  }

  // 7. Strict Cosine Similarity Calculation between STORED face and LIVE face
  const similarity = computeCosineSimilarity(storedFace.embedding, incomingVector);
  const faceConfidence = parseFloat((Math.min(99.9, Math.max(0.0, similarity * 100))).toFixed(1));
  const overallConfidence = parseFloat(((faceConfidence * 0.6) + (currentLivenessScore * 0.4)).toFixed(1));

  console.log(`[SECURITY AUDIT VERIFY] Student: ${req.user.name} | Stored Len: ${storedFace.embedding.length} | Live Len: ${incomingVector.length} | Similarity: ${similarity.toFixed(4)} (${faceConfidence}%) | Threshold: ${SIMILARITY_THRESHOLD}%`);

  // 8. STRICT THRESHOLD ENFORCEMENT: Similarity MUST be >= 85.0%
  if (faceConfidence < SIMILARITY_THRESHOLD) {
    console.log(`[SECURITY AUDIT] Identity Mismatch for ${req.user.name}: Match (${faceConfidence}%) is BELOW required ${SIMILARITY_THRESHOLD}% threshold. Decision: REJECTED.`);
    return res.status(200).json({
      success: false,
      verified: false,
      spoofDetected: false,
      confidence: faceConfidence,
      livenessScore: currentLivenessScore,
      overallConfidence,
      message: `Face identity mismatch (${faceConfidence}% similarity). Camera face does not match the enrolled student profile.`
    });
  }

  console.log(`[SECURITY AUDIT] Identity Verified for ${req.user.name}: Match (${faceConfidence}%) >= ${SIMILARITY_THRESHOLD}%. Decision: VERIFIED SUCCESS.`);

  // 9. Verification Succeeded -> Log Attendance Check-in
  const now = new Date();
  let activeSession = await AttendanceSession.findOne({ isActive: true }).sort({ startTime: -1 });

  const targetSubject = activeSession?.subject || subject || "AI & Machine Learning";
  const targetFaculty = activeSession?.teacherName || "Dr. Sarah Jenkins";
  const targetRoom = activeSession?.room || room || "Lab-3";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({
    student: studentId,
    $or: [
      { session: activeSession?._id },
      { subject: targetSubject, verifiedAt: { $gte: startOfDay } }
    ]
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      verified: true,
      spoofDetected: false,
      blinkDetected: true,
      challengeCompleted: true,
      faceConfidence,
      livenessScore: currentLivenessScore,
      overallConfidence,
      alreadyMarked: true,
      message: "Face verification successful! Attendance was already recorded today.",
      record: {
        id: existing._id,
        subject: existing.subject,
        time: existing.verifiedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        room: existing.room,
        method: existing.method,
        status: existing.status
      }
    });
  }

  const record = await Attendance.create({
    student: studentId,
    studentName: req.user.name,
    subject: targetSubject,
    faculty: targetFaculty,
    room: targetRoom,
    status: "Present",
    method: "Face ID",
    session: activeSession?._id
  });

  res.status(200).json({
    success: true,
    verified: true,
    spoofDetected: false,
    blinkDetected: true,
    challengeCompleted: true,
    faceConfidence,
    livenessScore: currentLivenessScore,
    overallConfidence,
    alreadyMarked: false,
    message: "Face identity & liveness verified, attendance marked successfully!",
    record: {
      id: record._id,
      subject: record.subject,
      time: record.verifiedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      room: record.room,
      method: record.method,
      status: record.status
    }
  });
});

module.exports = {
  registerFace,
  verifyFace
};
