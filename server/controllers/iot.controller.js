/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IoT Attendance Controller
 * Handles ESP32/IoT device attendance marking
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Class = require("../models/Class");

// In-memory session storage (for simplicity - could use Redis in production)
// Structure: { sessionId: { classId, date, teacherId, students: [], currentIndex, active, records: {} } }
const activeSessions = new Map();

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
    return `iot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Start IoT attendance session
 * POST /api/iot/session/start
 */
exports.startSession = async (req, res) => {
    try {
        const { classId, date } = req.body;
        const teacherId = req.teacherId;

        console.log("[IOT] Starting session for class:", classId, "date:", date);

        // Validate class exists and belongs to teacher
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        if (classDoc.teacher.toString() !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized - This class does not belong to you",
            });
        }

        // Check if attendance already exists for this class on this date
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

        // Get all students for the teacher
        const students = await Student.find({ teacher: teacherId }).sort({ rollNo: 1 });

        if (students.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No students found. Add students first.",
            });
        }

        // Check if there's already an active session for this teacher
        for (const [sessionId, session] of activeSessions) {
            if (session.teacherId === teacherId && session.active) {
                // End the previous session
                activeSessions.delete(sessionId);
                console.log("[IOT] Ended previous active session:", sessionId);
            }
        }

        // Create session
        const sessionId = generateSessionId();
        const session = {
            sessionId,
            classId,
            date,
            teacherId,
            students: students.map((s) => ({
                _id: s._id.toString(),
                name: s.name,
                rollNo: s.rollNo,
                section: s.section,
            })),
            currentIndex: 0,
            active: true,
            records: {}, // { studentId: 'present' | 'absent' }
            createdAt: new Date(),
        };

        activeSessions.set(sessionId, session);

        console.log("[IOT] Session created:", sessionId, "with", students.length, "students");

        res.json({
            success: true,
            message: "IoT attendance session started",
            sessionId,
            totalStudents: students.length,
            currentStudent: session.students[0],
        });
    } catch (err) {
        console.error("[IOT] Start session error:", err);
        res.status(500).json({
            success: false,
            message: "Server error while starting IoT session",
            error: err.message,
        });
    }
};

/**
 * Stop IoT attendance session and save records
 * POST /api/iot/session/stop
 */
exports.stopSession = async (req, res) => {
    try {
        const { sessionId, saveProgress } = req.body;
        const teacherId = req.teacherId;

        console.log("[IOT] Stopping session:", sessionId, "saveProgress:", saveProgress);

        const session = activeSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found or already ended",
            });
        }

        if (session.teacherId !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized - This session does not belong to you",
            });
        }

        // Mark session as inactive
        session.active = false;

        // Build attendance records
        const records = session.students.map((student) => ({
            student: student._id,
            status: session.records[student._id] || "absent", // Default to absent if not marked
        }));

        // If saveProgress is true and we have some records, save attendance
        if (saveProgress && Object.keys(session.records).length > 0) {
            const attendance = await Attendance.create({
                class: session.classId,
                teacher: teacherId,
                date: new Date(session.date),
                records,
            });

            console.log("[IOT] Attendance saved:", attendance._id);

            // Clean up session
            activeSessions.delete(sessionId);

            const presentCount = records.filter((r) => r.status === "present").length;
            const absentCount = records.length - presentCount;

            return res.json({
                success: true,
                message: "IoT session ended and attendance saved",
                attendanceId: attendance._id,
                summary: {
                    total: records.length,
                    present: presentCount,
                    absent: absentCount,
                },
            });
        }

        // Clean up session without saving
        activeSessions.delete(sessionId);

        res.json({
            success: true,
            message: "IoT session ended without saving",
        });
    } catch (err) {
        console.error("[IOT] Stop session error:", err);
        res.status(500).json({
            success: false,
            message: "Server error while stopping IoT session",
            error: err.message,
        });
    }
};

/**
 * Get current student for IoT device
 * GET /api/iot/current/:sessionId
 * 
 * This is the endpoint ESP32 calls to get the current student
 */
exports.getCurrentStudent = async (req, res) => {
    try {
        const { sessionId } = req.params;

        console.log("[IOT] Getting current student for session:", sessionId);

        const session = activeSessions.get(sessionId);

        if (!session) {
            return res.json({
                success: false,
                status: "no_session",
                message: "Session not found or ended",
            });
        }

        if (!session.active) {
            return res.json({
                success: false,
                status: "session_inactive",
                message: "Session is no longer active",
            });
        }

        // Check if we've gone through all students
        if (session.currentIndex >= session.students.length) {
            return res.json({
                success: true,
                status: "done",
                message: "All students have been processed",
                summary: {
                    total: session.students.length,
                    present: Object.values(session.records).filter((s) => s === "present").length,
                    absent: Object.values(session.records).filter((s) => s === "absent").length,
                },
            });
        }

        const currentStudent = session.students[session.currentIndex];

        res.json({
            success: true,
            status: "active",
            name: currentStudent.name,
            roll: currentStudent.rollNo,
            section: currentStudent.section,
            attendanceId: `${sessionId}:${currentStudent._id}`,
            position: session.currentIndex + 1,
            total: session.students.length,
        });
    } catch (err) {
        console.error("[IOT] Get current student error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};

/**
 * Mark attendance from IoT device
 * POST /api/iot/mark
 * 
 * This is the endpoint ESP32 calls to mark attendance
 */
exports.markAttendance = async (req, res) => {
    try {
        const { attendanceId, status } = req.body;

        console.log("[IOT] Marking attendance:", attendanceId, "status:", status);

        if (!attendanceId || !status) {
            return res.status(400).json({
                success: false,
                message: "attendanceId and status are required",
            });
        }

        if (!["present", "absent"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be 'present' or 'absent'",
            });
        }

        // Parse attendanceId (format: sessionId:studentId)
        const [sessionId, studentId] = attendanceId.split(":");

        if (!sessionId || !studentId) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendanceId format",
            });
        }

        const session = activeSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found or ended",
            });
        }

        if (!session.active) {
            return res.status(400).json({
                success: false,
                message: "Session is no longer active",
            });
        }

        // Verify the student is the current one
        const currentStudent = session.students[session.currentIndex];
        if (currentStudent._id !== studentId) {
            return res.status(400).json({
                success: false,
                message: "Student does not match current position",
            });
        }

        // Record the attendance
        session.records[studentId] = status;

        // Move to next student
        session.currentIndex++;

        console.log(
            "[IOT] Marked",
            currentStudent.name,
            "as",
            status,
            "- Moving to index",
            session.currentIndex
        );

        // Check if we're done
        const isDone = session.currentIndex >= session.students.length;

        if (isDone) {
            return res.json({
                success: true,
                message: `Marked ${currentStudent.name} as ${status}`,
                status: "done",
                summary: {
                    total: session.students.length,
                    present: Object.values(session.records).filter((s) => s === "present").length,
                    absent: Object.values(session.records).filter((s) => s === "absent").length,
                },
            });
        }

        // Return next student info
        const nextStudent = session.students[session.currentIndex];

        res.json({
            success: true,
            message: `Marked ${currentStudent.name} as ${status}`,
            status: "next",
            next: {
                name: nextStudent.name,
                roll: nextStudent.rollNo,
                section: nextStudent.section,
                attendanceId: `${sessionId}:${nextStudent._id}`,
                position: session.currentIndex + 1,
                total: session.students.length,
            },
        });
    } catch (err) {
        console.error("[IOT] Mark attendance error:", err);
        res.status(500).json({
            success: false,
            message: "Server error while marking attendance",
            error: err.message,
        });
    }
};

/**
 * Get session status
 * GET /api/iot/session/status/:sessionId
 */
exports.getSessionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const teacherId = req.teacherId;

        const session = activeSessions.get(sessionId);

        if (!session) {
            return res.json({
                success: false,
                status: "not_found",
                message: "Session not found",
            });
        }

        if (session.teacherId !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const presentCount = Object.values(session.records).filter((s) => s === "present").length;
        const absentCount = Object.values(session.records).filter((s) => s === "absent").length;
        const pendingCount = session.students.length - presentCount - absentCount;

        res.json({
            success: true,
            sessionId,
            active: session.active,
            classId: session.classId,
            date: session.date,
            totalStudents: session.students.length,
            currentIndex: session.currentIndex,
            currentStudent: session.active && session.currentIndex < session.students.length
                ? session.students[session.currentIndex]
                : null,
            summary: {
                present: presentCount,
                absent: absentCount,
                pending: pendingCount,
            },
            records: session.records,
        });
    } catch (err) {
        console.error("[IOT] Get session status error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};

/**
 * Skip current student (mark as absent and move to next)
 * POST /api/iot/skip
 */
exports.skipStudent = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const teacherId = req.teacherId;

        const session = activeSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        if (session.teacherId !== teacherId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!session.active) {
            return res.status(400).json({
                success: false,
                message: "Session is not active",
            });
        }

        if (session.currentIndex >= session.students.length) {
            return res.status(400).json({
                success: false,
                message: "No more students to skip",
            });
        }

        const currentStudent = session.students[session.currentIndex];
        session.records[currentStudent._id] = "absent";
        session.currentIndex++;

        console.log("[IOT] Skipped student:", currentStudent.name);

        const isDone = session.currentIndex >= session.students.length;

        res.json({
            success: true,
            message: `Skipped ${currentStudent.name} (marked as absent)`,
            isDone,
            nextStudent: isDone ? null : session.students[session.currentIndex],
        });
    } catch (err) {
        console.error("[IOT] Skip student error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};
