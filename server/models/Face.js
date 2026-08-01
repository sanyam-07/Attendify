// Mongoose Face Biometric Model
// Stores 128-dimensional floating point embedding vectors for face biometrics verification.
// Never stores raw images.

const mongoose = require("mongoose");

const faceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    embedding: {
      type: [Number],
      required: [true, "Embedding vector is required"]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Face", faceSchema);
