// Mongoose Database Connection configuration
// Configured to connect to MongoDB instance using dotenv parameters.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/attendify", {
      // Configuration options if needed in future mongoose revisions
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1); // Exit process on failure
  }
};

module.exports = connectDB;
