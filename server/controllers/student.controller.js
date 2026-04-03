const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

exports.addStudent = async (req, res) => {
  try {
    const { name, rollNo, section, phone, parentPhone, notes } = req.body;

    const normalizedSection = (section || 'General').trim().toUpperCase();

    const existingStudent = await Student.findOne({ admin: req.userId, section: normalizedSection, rollNo });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: `Roll number ${rollNo} already exists in ${normalizedSection}` });
    }

    const newStudent = await Student.create({
      name: name.trim(),
      rollNo: rollNo.trim(),
      section: normalizedSection,
      phone: phone || '',
      parentPhone: parentPhone || '',
      notes: notes || '',
      admin: req.userId,
    });

    res.status(201).json({ success: true, message: "Student added successfully", student: newStudent });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Roll number already exists in this section" });
    }
    res.status(500).json({ success: false, message: "Server error while adding student", error: err.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const query = {};
    const user = await User.findById(req.userId);
    if (user && user.role === "admin") {
      query.admin = req.userId;
    }
    const students = await Student.find(query).sort({ section: 1, rollNo: 1 });
    res.json({ success: true, count: students.length, students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error while fetching students", error: err.message });
  }
};

// GET attendance stats per student
exports.getStudentStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Find all attendance records where this student appears
    const records = await Attendance.find({ 'records.student': studentId })
      .populate('class', 'subject date startTime endTime')
      .populate('takenBy', 'name')
      .sort({ date: -1 });

    const stats = records.map(r => {
      const rec = r.records.find(x => x.student.toString() === studentId);
      return {
        date: r.date,
        subject: r.class?.subject,
        classId: r.class?._id,
        status: rec?.status || 'absent',
        note: r.note || '',
        takenBy: r.takenBy?.name || 'Admin',
      };
    });

    const totalClasses = stats.length;
    const attended = stats.filter(s => s.status === 'present').length;

    res.json({ success: true, totalClasses, attended, absent: totalClasses - attended, records: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
