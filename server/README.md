# Attendify Backend Server Boilerplate

This directory holds the Express.js and Node.js backend boilerplate code, structured for integration into a complete MERN (MongoDB, Express, React, Node) stack.

---

## Folder Structure

```text
server/
├── config/             # Database connection setups
│   └── db.js
├── controllers/        # Route controller handlers
│   └── authController.js
├── middleware/         # Custom Express validation middleware
│   └── authMiddleware.js
├── models/             # Mongoose MongoDB Document Schemas
│   ├── User.js
│   └── Attendance.js
├── routes/             # Express routing scopes
│   └── authRoutes.js
├── .env.example        # Environment variable configurations
├── app.js              # Express app setup and middleware configuration
├── package.json        # Node.js backend dependency files
└── server.js           # Server startup and database hook listener
```

---

## Installation & Startup

To run the backend server:

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the env file and configure your Mongo Database URI and secrets:
   ```bash
   copy .env.example .env
   ```
4. Start the server (Development mode via nodemon):
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5000/`.
