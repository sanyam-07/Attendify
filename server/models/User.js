// Mongoose User Schema
// Core user model handling authentication, password hashing, and role definition.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student"
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
    },
    phone: {
      type: String,
      default: "9876543210",
      validate: {
        validator: function (v) {
          if (!v) return true;
          const clean = String(v).replace(/^(\+91|\+91\s*)/, "").replace(/\D/g, "");
          return /^[6-9][0-9]{9}$/.test(clean);
        },
        message: "Please enter a valid 10-digit Indian mobile number."
      }
    },
    notificationPreferences: {
      attendance: { type: Boolean, default: true },
      assignment: { type: Boolean, default: true },
      exam: { type: Boolean, default: true },
      timetable: { type: Boolean, default: true },
      system: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
