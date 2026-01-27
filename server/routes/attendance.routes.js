const express = require("express");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// Mark attendance
router.post("/", auth, async (req, res) => {
  const attendance = await Attendance.create(req.body);
  res.json(attendance);
});

// Get attendance of a class
router.get("/:classId", auth, async (req, res) => {
  const records = await Attendance.find({
    class: req.params.classId,
  }).populate("records.student");

  res.json(records);
});

module.exports = router;
