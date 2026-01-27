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

module.exports = router;
