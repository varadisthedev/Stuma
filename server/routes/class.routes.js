const express = require("express");
const Class = require("../models/Class");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// Create class
router.post("/", auth, async (req, res) => {
  const newClass = await Class.create({
    ...req.body,
    teacher: req.teacherId,
  });

  res.json(newClass);
});

// Get today's classes
router.get("/today", auth, async (req, res) => {
  const today = new Date().toLocaleString("en-US", { weekday: "long" });

  const classes = await Class.find({
    teacher: req.teacherId,
    day: today,
  });

  res.json(classes);
});

module.exports = router;
