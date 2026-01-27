const Student = require("../models/Student");

exports.addStudent = async (req, res) => {
  try {
    const { name, rollNo } = req.body;

    // Check if roll number already exists for this teacher
    const existingStudent = await Student.findOne({
      teacher: req.teacherId,
      rollNo,
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Roll number ${rollNo} already exists for your students`,
      });
    }

    const student = await Student.create({
      name,
      rollNo,
      teacher: req.teacherId,
    });

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      student,
    });
  } catch (err) {
    console.error("Add student error:", err);

    // Handle unique index violation (in case race condition)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Roll number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding student",
      error: err.message,
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find({
      teacher: req.teacherId,
    }).sort({ rollNo: 1 });

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (err) {
    console.error("Get students error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching students",
      error: err.message,
    });
  }
};
