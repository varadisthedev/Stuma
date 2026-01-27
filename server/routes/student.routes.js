const express = require("express");
const Student = require("../models/Student");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// Add student
router.post("/", auth, async (req, res) => {
  const student = await Student.create({
    ...req.body,
    teacher: req.teacherId,
  });

  res.json(student);
});

// Get all students
router.get("/", auth, async (req, res) => {
  const students = await Student.find({ teacher: req.teacherId });
  res.json(students);
});

module.exports = router;
