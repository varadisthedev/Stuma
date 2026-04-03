const Class = require("../models/Class");
const User = require("../models/User");

exports.createClass = async (req, res) => {
  try {
    const { subject, date, day, startTime, endTime, assignedVolunteer, youtubeLink } = req.body;

    const classDate = date || new Date().toISOString().split('T')[0];

    if (assignedVolunteer) {
      const overlappingClass = await Class.findOne({
        assignedVolunteer,
        date: classDate,
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } }
        ]
      });

      if (overlappingClass) {
        return res.status(400).json({
          success: false,
          message: "Volunteer is busy during this time slot on this date."
        });
      }
    }

    const newClass = await Class.create({
      subject,
      date: classDate,
      day,
      startTime,
      endTime,
      admin: req.userId,
      assignedVolunteer,
      youtubeLink,
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
    const user = await User.findById(req.userId);

    const query = { day: today };
    if (user && user.role === "admin") {
      query.admin = req.userId;
    } else if (user && user.role === "volunteer") {
      query.assignedVolunteer = req.userId;
    }

    const classes = await Class.find(query).sort({ startTime: 1 }); // Sort by start time

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
    
    const user = await User.findById(req.userId);

    const query = { day: day };
    if (user && user.role === "admin") {
      query.admin = req.userId;
    } else if (user && user.role === "volunteer") {
      query.assignedVolunteer = req.userId;
    }

    const classes = await Class.find(query);

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
    const user = await User.findById(req.userId);
    
    const query = {};
    if (user && user.role === "admin") {
      query.admin = req.userId;
    } else if (user && user.role === "volunteer") {
      query.assignedVolunteer = req.userId;
    }

    const classes = await Class.find(query).populate('assignedVolunteer', 'name email').sort({ day: 1, startTime: 1 });

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
