const express = require("express");
const controller = require("../controllers/attendance.controller");
const auth = require("../middleware/auth.middleware");
const {
  markAttendanceValidation,
  classIdParamValidation,
  attendanceIdParamValidation,
} = require("../validators/attendance.validator");

const router = express.Router();

// Mark attendance
router.post("/", auth, markAttendanceValidation, controller.markAttendance);

// Get attendance records for a specific class
router.get(
  "/class/:classId",
  auth,
  classIdParamValidation,
  controller.getAttendanceByClass
);

// Get analytics for a specific class
router.get(
  "/analytics/:classId",
  auth,
  classIdParamValidation,
  controller.attendanceAnalytics
);

// Get chart data for a specific attendance record
router.get(
  "/chart/:attendanceId",
  auth,
  attendanceIdParamValidation,
  controller.attendanceChartData
);

// Get AI insights prompt for a specific class
router.get(
  "/ai-insights/:classId",
  auth,
  classIdParamValidation,
  controller.getAIInsightsPrompt
);

// Get overall analytics across all classes (for dashboard)
router.get("/overall", auth, controller.getOverallAnalytics);

// Get overall AI insights (no class filter, program-level)
router.get("/overall-ai", auth, controller.getOverallAIInsights);

module.exports = router;
