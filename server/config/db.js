// Mongoose Database Connection configuration
// Configured to connect to MongoDB instance using dotenv parameters.

const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/attendify";
  const uriLoaded = Boolean(process.env.MONGODB_URI || process.env.MONGO_URI);
  
  console.log(`MongoDB URI loaded: ${uriLoaded}`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`Database connection status: connected (${conn.connection.host})`);
    return conn;
  } catch (error) {
    console.error(`Database connection status: failed (${error.message})`);
    console.error(`Note: If connecting to MongoDB Atlas, check network access / IP Whitelist (0.0.0.0/0) in MongoDB Atlas console.`);
    // Allow server to handle fallback/mock modes or startup notice without unhandled process exit
  }
};

module.exports = connectDB;
