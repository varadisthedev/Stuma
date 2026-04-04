const axios = require("axios");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Class = require("../models/Class");
const User = require("../models/User");

// Simple in-memory cache for AI insights (5 minute TTL)
const aiInsightsCache = new Map();
const AI_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

exports.markAttendance = async (req, res) => {
  try {
    const { class: classId, date, records, note } = req.body;

    // Verify class ownership
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const user = await User.findById(req.userId);
    const isVolunteer = user && user.role === "volunteer";

    if (classDoc.admin.toString() !== req.userId && !(isVolunteer && classDoc.assignedVolunteer?.toString() === req.userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized - You are not authorized for this class" });
    }

    const existingAttendance = await Attendance.findOne({ class: classId, date: new Date(date) });
    if (existingAttendance) {
      return res.status(400).json({ success: false, message: "Attendance already marked for this class on this date" });
    }

    const studentIds = records.map((r) => r.student);
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(400).json({ success: false, message: "One or more students do not belong to you" });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      class: classId,
      admin: isVolunteer ? classDoc.admin : req.userId,
      takenBy: req.userId,
      date: new Date(date),
      note: note || '',
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

    const user = await User.findById(req.userId);
    const isVolunteer = user && user.role === "volunteer";
    if (classDoc.admin.toString() !== req.userId && !(isVolunteer && classDoc.assignedVolunteer?.toString() === req.userId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - You are not authorized for this class",
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

    const user = await User.findById(req.userId);
    const isVolunteer = user && user.role === "volunteer";
    if (classDoc.admin.toString() !== req.userId && !(isVolunteer && classDoc.assignedVolunteer?.toString() === req.userId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - You are not authorized for this class",
      });
    }

    // fetch all students if volunteer, or admin's students 
    const studentQuery = isVolunteer ? {} : { admin: req.userId };
    const students = await Student.find(studentQuery);
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

    const user = await User.findById(req.userId);
    const isVolunteer = user && user.role === "volunteer";
    if (attendance.admin.toString() !== req.userId && !(isVolunteer && true)) { // Allow volunteer to see attendance for their assigned classes if we find the class doc
      // For now simplify to: only check attendance admin if not volunteer
      if (user && user.role === "admin" && attendance.admin.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized - This attendance record does not belong to you",
        });
      }
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

    // Check cache first
    const cacheKey = `ai_insights_${classId}`;
    const cachedData = aiInsightsCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < AI_CACHE_TTL) {
      console.log("[AI] Returning cached insights for class:", classId);
      return res.json(cachedData.response);
    }

    // Verify class ownership
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const user = await User.findById(req.userId);
    const isVolunteer = user && user.role === "volunteer";
    if (classDoc.admin.toString() !== req.userId && !(isVolunteer && classDoc.assignedVolunteer?.toString() === req.userId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const studentQuery = isVolunteer ? {} : { admin: req.userId };
    const students = await Student.find(studentQuery);
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

    // Limit critical students in prompt to avoid huge token usage (show worst 15)
    const criticalForPrompt = critical
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 15);
    const criticalListText = criticalForPrompt.length > 0
      ? `Top ${criticalForPrompt.length} Critical Students (showing worst cases): ${criticalForPrompt.map((s) => `${s.name} (${s.percent}%)`).join(", ")}${critical.length > 15 ? ` ... and ${critical.length - 15} more` : ""}`
      : "";

    const prompt = `
You are an education analyst reviewing attendance data for a class.

Class: ${classDoc.subject}
Total Classes Conducted: ${attendance.length}
Total Students: ${students.length}

Attendance Breakdown:
- Perfect attendance (100%): ${perfect.length} students
- Above 75% attendance: ${over75.length} students
- Critical (<75% attendance): ${critical.length} students

${criticalListText}

Please provide:
1. Overall classroom attendance health
2. Risk warnings if any students are in danger of failing
3. One actionable suggestion for the teacher to improve attendance

Keep response concise and professional.
    `.trim();

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[AI] No Gemini API key found in server environment");
      return res.json({
        success: false,
        message: "Gemini API key not configured. Add GEMINI_API_KEY to your server .env file.",
        prompt,
        data: {
          perfect,
          over75,
          critical,
        },
      });
    }

    // Call Gemini API
    try {
      console.log("[AI] Sending prompt to Gemini API");
      const geminiResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const aiText = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiText) {
        console.log("[AI] Gemini response received successfully");
        const responseData = {
          success: true,
          text: aiText,
          data: {
            perfect,
            over75,
            critical,
          },
        };

        // Cache the successful response
        aiInsightsCache.set(cacheKey, {
          timestamp: Date.now(),
          response: responseData,
        });

        return res.json(responseData);
      } else {
        console.error("[AI] Unexpected Gemini response format:", geminiResponse.data);
        return res.json({
          success: false,
          message: "Unexpected response format from Gemini",
          prompt,
          data: {
            perfect,
            over75,
            critical,
          },
        });
      }
    } catch (geminiError) {
      console.error("[AI] Gemini API error:", geminiError.response?.data || geminiError.message);

      let message = "Failed to get AI insights";
      if (geminiError.response?.status === 400) {
        message = "Invalid request to Gemini API. Please check your API key.";
      } else if (geminiError.response?.status === 403) {
        message = "API key is invalid or has been revoked.";
      } else if (geminiError.response?.status === 429) {
        message = "API quota exceeded. Please try again later.";
      } else if (geminiError.response?.status === 500) {
        message = "Gemini service temporarily unavailable. Please try again.";
      } else if (geminiError.response?.data?.error?.message) {
        message = geminiError.response.data.error.message;
      } else if (geminiError.code === "ENOTFOUND" || geminiError.code === "ECONNREFUSED") {
        message = "Network error. Please check server internet connection.";
      }

      return res.json({
        success: false,
        message,
        prompt,
        data: {
          perfect,
          over75,
          critical,
        },
      });
    }
  } catch (err) {
    console.error("AI insights error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while generating AI insights",
      error: err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Overall Analytics (program-level, no class filter)
// ─────────────────────────────────────────────────────────────────────────────
exports.getOverallAnalytics = async (req, res) => {
  try {
    console.log('[OVERALL ANALYTICS] Loading for user:', req.userId);
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const isVolunteer = user.role === 'volunteer';
    const classFilter = isVolunteer ? { assignedVolunteer: req.userId } : { admin: req.userId };

    const classes = await Class.find(classFilter).populate('assignedVolunteer', 'name').lean();
    console.log('[OVERALL ANALYTICS] Found classes:', classes.length);

    // Volunteer class distribution
    const volunteerMap = {};
    classes.forEach(c => {
      const vol = c.assignedVolunteer;
      const key = vol ? (vol._id?.toString() || String(vol)) : '__unassigned__';
      const name = vol?.name || 'Unassigned';
      if (!volunteerMap[key]) volunteerMap[key] = { name, count: 0 };
      volunteerMap[key].count++;
    });
    const volunteerDistribution = Object.values(volunteerMap).sort((a, b) => b.count - a.count);

    // Weekly class count (last 8 weeks)
    const now = new Date();
    const weeklyData = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - w * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = classes.filter(c => {
        const d = new Date(c.date);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeklyData.push({ label, count });
    }
    console.log('[OVERALL ANALYTICS] Weekly data:', JSON.stringify(weeklyData));

    // Overall attendance
    const attendanceFilter = isVolunteer ? { takenBy: req.userId } : { admin: req.userId };
    const allAttendance = await Attendance.find(attendanceFilter).lean();
    const totalSessions = allAttendance.length;
    const totalPresent = allAttendance.reduce((sum, a) => sum + a.records.filter(r => r.status === 'present').length, 0);
    const totalStudents = allAttendance.reduce((sum, a) => sum + a.records.length, 0);
    const overallRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
    console.log('[OVERALL ANALYTICS] Rate:', overallRate + '%', 'sessions:', totalSessions);

    res.json({
      success: true,
      totalClasses: classes.length,
      totalSessions,
      overallRate,
      volunteerDistribution,
      weeklyData,
    });
  } catch (err) {
    console.error('[OVERALL ANALYTICS] Error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// Overall AI Insights (Gemini call across all classes)
exports.getOverallAIInsights = async (req, res) => {
  try {
    console.log('[OVERALL AI] Generating insights for user:', req.userId);
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    const isVolunteer = user?.role === 'volunteer';
    const classFilter = isVolunteer ? { assignedVolunteer: req.userId } : { admin: req.userId };

    const classes = await Class.find(classFilter).lean();
    const attendanceFilter = isVolunteer ? { takenBy: req.userId } : { admin: req.userId };
    const allAttendance = await Attendance.find(attendanceFilter).lean();

    const totalPresent = allAttendance.reduce((sum, a) => sum + a.records.filter(r => r.status === 'present').length, 0);
    const totalStudents = allAttendance.reduce((sum, a) => sum + a.records.length, 0);
    const overallRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    const prompt = `You are an education analytics assistant for a foundation tutoring program.
Summarize the data below and provide 2-3 short insights:

Total Classes Scheduled: ${classes.length}
Attendance Sessions Recorded: ${allAttendance.length}
Overall Attendance Rate: ${overallRate}%
Total Student Slots: ${totalStudents}
Total Present Slots: ${totalPresent}

Provide:
1. A one-line program health summary
2. One risk or concern (if any)
3. One actionable recommendation

Keep it brief and encouraging. Use plain text, no markdown.`.trim();

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[OVERALL AI] API key present:', !!apiKey);
    if (!apiKey) {
      return res.json({ success: false, message: 'GEMINI_API_KEY not set in server .env file.' });
    }

    console.log('[OVERALL AI] Calling Gemini...');
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    const text = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('[OVERALL AI] Response length:', text?.length ?? 0);

    if (text) return res.json({ success: true, text });
    return res.json({ success: false, message: 'Empty response from Gemini.' });
  } catch (err) {
    console.error('[OVERALL AI] Error:', err.response?.data || err.message);
    const msg = err.response?.status === 403 ? 'Invalid Gemini API key.'
      : err.response?.status === 429 ? 'Gemini quota exceeded. Try again later.'
      : err.code === 'ENOTFOUND' ? 'Network error reaching Gemini API.'
      : (err.response?.data?.error?.message || 'Failed to get AI insights.');
    res.json({ success: false, message: msg });
  }
};
