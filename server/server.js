// Server bootstrap file
// Triggers Mongoose loader, sets port configurations, and launches Express listener.

const dotenv = require("dotenv");
const path = require("path");

// Load Environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect Mongoose to MongoDB Database Instance
  await connectDB();

  // Listen for requests
  const server = app.listen(PORT, () => {
    console.log(`Attendify Backend Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });

  // Handle unhandled Promise rejections gracefully
  process.on("unhandledRejection", (err) => {
    console.log(`Unhandled Promise Rejection: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();
