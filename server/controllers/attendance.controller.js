const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Class = require("../models/Class");

exports.markAttendance = async (req, res) => {
  try {
    const { class: classId, date, records } = req.body;

    // Verify class ownership
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classDoc.teacher.toString() !== req.teacherId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - This class does not belong to you",
      });
    }

    // Check if attendance already marked for this class on this date
    const existingAttendance = await Attendance.findOne({
      class: classId,
      date: new Date(date),
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this class on this date",
      });
    }

    // Verify all students belong to this teacher
    const studentIds = records.map((r) => r.student);
    const students = await Student.find({
      _id: { $in: studentIds },
      teacher: req.teacherId,
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more students do not belong to you",
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      class: classId,
      teacher: req.teacherId,
      date: new Date(date),
      records,
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("class")
      .populate("records.student");

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance: populatedAttendance,
    });
  } catch (err) {
    console.error("Mark attendance error:", err);

    // Handle duplicate attendance (unique index violation)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for this class on this date",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while marking attendance",
      error: err.message,
    });
  }
};

exports.getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify class ownership
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classDoc.teacher.toString() !== req.teacherId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - This class does not belong to you",
      });
    }

    const records = await Attendance.find({
      class: classId,
    })
      .populate("records.student")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (err) {
    console.error("Get attendance error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching attendance",
      error: err.message,
    });
  }
};

exports.attendanceAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify class ownership
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classDoc.teacher.toString() !== req.teacherId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - This class does not belong to you",
      });
    }

    const students = await Student.find({ teacher: req.teacherId });
    const attendance = await Attendance.find({ class: classId });

    const stats = students.map((student) => {
      let present = 0;
      let total = 0;

      attendance.forEach((day) => {
        const record = day.records.find(
          (r) => r.student.toString() === student._id.toString()
        );

        if (record) {
          total++;
          if (record.status === "present") present++;
        }
      });

      const percent = total === 0 ? 0 : Math.round((present / total) * 100);

      return {
        studentId: student._id,
        name: student.name,
        rollNo: student.rollNo,
        present,
        total,
        percent,
      };
    });

    const perfect = stats.filter((s) => s.percent === 100);
    const over75 = stats.filter((s) => s.percent >= 75 && s.percent < 100);
    const critical = stats.filter((s) => s.percent < 75);

    res.json({
      success: true,
      classId,
      totalDays: attendance.length,
      stats,
      categories: {
        perfect: {
          count: perfect.length,
          students: perfect,
        },
        above75: {
          count: over75.length,
          students: over75,
        },
        critical: {
          count: critical.length,
          students: critical,
        },
      },
    });
  } catch (err) {
    console.error("Attendance analytics error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while generating analytics",
      error: err.message,
    });
  }
};

exports.attendanceChartData = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Verify ownership
    if (attendance.teacher.toString() !== req.teacherId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - This attendance record does not belong to you",
      });
    }

    const present = attendance.records.filter(
      (r) => r.status === "present"
    ).length;

    const absent = attendance.records.length - present;

    res.json({
      success: true,
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [present, absent],
          backgroundColor: ["#4CAF50", "#F44336"],
        },
      ],
    });
  } catch (err) {
    console.error("Chart data error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while generating chart data",
      error: err.message,
    });
  }
};

exports.getAIInsightsPrompt = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify class ownership
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (classDoc.teacher.toString() !== req.teacherId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const students = await Student.find({ teacher: req.teacherId });
    const attendance = await Attendance.find({ class: classId });

    const stats = students.map((student) => {
      let present = 0;
      let total = 0;

      attendance.forEach((day) => {
        const record = day.records.find(
          (r) => r.student.toString() === student._id.toString()
        );

        if (record) {
          total++;
          if (record.status === "present") present++;
        }
      });

      const percent = total === 0 ? 0 : Math.round((present / total) * 100);
      return { name: student.name, percent };
    });

    const perfect = stats.filter((s) => s.percent === 100);
    const over75 = stats.filter((s) => s.percent >= 75 && s.percent < 100);
    const critical = stats.filter((s) => s.percent < 75);

    const prompt = `
You are an education analyst reviewing attendance data for a class.

Class: ${classDoc.subject}
Total Classes Conducted: ${attendance.length}
Total Students: ${students.length}

Attendance Breakdown:
- Perfect attendance (100%): ${perfect.length} students
- Above 75% attendance: ${over75.length} students
- Critical (<75% attendance): ${critical.length} students

${critical.length > 0 ? `Critical Students: ${critical.map((s) => `${s.name} (${s.percent}%)`).join(", ")}` : ""}

Please provide:
1. Overall classroom attendance health
2. Risk warnings if any students are in danger of failing
3. One actionable suggestion for the teacher to improve attendance

Keep response concise and professional.
    `.trim();

    res.json({
      success: true,
      prompt,
      data: {
        perfect,
        over75,
        critical,
      },
    });
  } catch (err) {
    console.error("AI insights error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while generating AI insights",
      error: err.message,
    });
  }
};
