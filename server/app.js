const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

const authRoutes = require("./routes/auth.routes");
const classRoutes = require("./routes/class.routes");
const studentRoutes = require("./routes/student.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const messageRoutes = require("./routes/message.routes");
const photoRoutes = require("./routes/photo.routes");
const alertRoutes = require("./routes/alert.routes");

// Initialize Cloudinary config
require('./config/cloudinary');

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://stumafrontend.vercel.app",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/alerts", alertRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
