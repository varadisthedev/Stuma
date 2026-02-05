/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IoT Attendance Routes
 * Endpoints for ESP32/IoT device attendance marking
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require("express");
const controller = require("../controllers/iot.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Require teacher authentication)
// These are called from the frontend
// ═══════════════════════════════════════════════════════════════════════════

// Start IoT attendance session
router.post("/session/start", auth, controller.startSession);

// Stop IoT attendance session
router.post("/session/stop", auth, controller.stopSession);

// Get session status
router.get("/session/status/:sessionId", auth, controller.getSessionStatus);

// Skip current student
router.post("/skip", auth, controller.skipStudent);

// ═══════════════════════════════════════════════════════════════════════════
// ESP32 ROUTES (No auth - called directly by IoT device)
// Note: In production, you might want to add device-level authentication
// ═══════════════════════════════════════════════════════════════════════════

// Get current student for attendance (ESP32 calls this)
router.get("/current/:sessionId", controller.getCurrentStudent);

// Mark attendance (ESP32 calls this)
router.post("/mark", controller.markAttendance);

module.exports = router;
