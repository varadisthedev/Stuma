const Class = require("../models/Class");

exports.createClass = async (req, res) => {
  try {
    const { subject, day, startTime, endTime } = req.body;

    const newClass = await Class.create({
      subject,
      day,
      startTime,
      endTime,
      teacher: req.teacherId,
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (err) {
    console.error("Create class error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while creating class",
      error: err.message,
    });
  }
};

exports.getTodayClasses = async (req, res) => {
  try {
    const today = new Date().toLocaleString("en-US", { weekday: "long" });

    const classes = await Class.find({
      teacher: req.teacherId,
      day: today,
    }).sort({ startTime: 1 }); // Sort by start time

    res.json({
      success: true,
      day: today,
      classes,
    });
  } catch (err) {
    console.error("Get today classes error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching today's classes",
      error: err.message,
    });
  }
};

exports.getCurrentClass = async (req, res) => {
  try {
    const now = new Date();
    const day = now.toLocaleString("en-US", { weekday: "long" });
    const currentTime = now.toTimeString().slice(0, 5); // "14:30" format

    const classes = await Class.find({
      teacher: req.teacherId,
      day: day,
    });

    // Find the class that is currently running
    const currentClass = classes.find((c) => {
      return currentTime >= c.startTime && currentTime < c.endTime;
    });

    res.json({
      success: true,
      currentTime,
      day,
      currentClass: currentClass || null,
    });
  } catch (err) {
    console.error("Get current class error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching current class",
      error: err.message,
    });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find({
      teacher: req.teacherId,
    }).sort({ day: 1, startTime: 1 });

    res.json({
      success: true,
      classes,
    });
  } catch (err) {
    console.error("Get all classes error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching classes",
      error: err.message,
    });
  }
};
