/**
 * ═══════════════════════════════════════════════════════════════════════════
 * IoT Attendance Controller
 * Handles ESP32/IoT device attendance marking
 * 
 * STATE MACHINE:
 * - Session lifecycle: active | ended | no_session
 * - Student availability: hasStudent (true = student ready for ESP32)
 * 
 * FLOW:
 * 1. Admin starts session → active=true, hasStudent=false
 * 2. Admin clicks "Next Student" → hasStudent=true (ESP32 sees student)
 * 3. ESP32 marks attendance → hasStudent=false, currentIndex++ (waits)
 * 4. Admin clicks "Next Student" → hasStudent=true (repeat)
 * 5. All students done → status="done"
 * ═══════════════════════════════════════════════════════════════════════════
 */

const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Class = require("../models/Class");

// In-memory session storage (for simplicity - could use Redis in production)
// Structure: { sessionId: { ..., hasStudent: boolean, ... } }
const activeSessions = new Map();

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
    return `iot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get Active Session for ESP32 Auto-Discovery
 * GET /api/iot/active-session
 * 
 * NO AUTH REQUIRED - ESP32 calls this on boot to discover active session
 * 
 * This allows ESP32 devices to automatically find and connect to 
 * the current IoT attendance session without hardcoding sessionId.
 * 
 * Returns:
 * - status: "active" | "none"
 * - sessionId: string | null
 */
exports.getActiveSession = async (req, res) => {
    try {
        console.log("[IOT] ESP32 requesting active session discovery");
        console.log("[IOT] Total sessions in memory:", activeSessions.size);

        // Debug: List all sessions
        for (const [id, sess] of activeSessions) {
            console.log(`[IOT] Session ${id}: active=${sess.active}`);
        }

        // Find the most recently created active session
        // (In case multiple sessions exist, prioritize the newest one)
        let activeSession = null;
        let latestCreatedAt = null;

        for (const [sessionId, session] of activeSessions) {
            if (session.active) {
                // Pick the most recently started session
                if (!latestCreatedAt || session.createdAt > latestCreatedAt) {
                    activeSession = session;
                    latestCreatedAt = session.createdAt;
                }
            }
        }

        // Case: No active session found
        if (!activeSession) {
            console.log("[IOT] No active session found for ESP32");
            return res.json({
                success: true,
                status: "none",
                sessionId: null,
            });
        }

        // Case: Active session found - return sessionId only (no student data)
        console.log("[IOT] Found active session for ESP32:", activeSession.sessionId);
        return res.json({
            success: true,
            status: "active",
            sessionId: activeSession.sessionId,
        });

    } catch (err) {
        console.error("[IOT] Get active session error:", err);
        res.status(500).json({
            success: false,
            status: "error",
            sessionId: null,
            message: "Server error",
            error: err.message,
        });
    }
};

/**
 * Start IoT attendance session
 * POST /api/iot/session/start
 * 
 * Creates session with hasStudent=false (admin must click "Next" to assign first student)
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

        // Create session with hasStudent=false initially
        // Admin must click "Next Student" to assign first student to ESP32
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
            hasStudent: false,  // 🔑 KEY: No student assigned yet, ESP32 will wait
            records: {},        // { studentId: 'present' | 'absent' }
            createdAt: new Date(),
        };

        activeSessions.set(sessionId, session);

        console.log("[IOT] Session created:", sessionId, "with", students.length, "students", "hasStudent:", session.hasStudent);

        res.json({
            success: true,
            message: "IoT attendance session started. Click 'Next Student' to begin.",
            sessionId,
            totalStudents: students.length,
            hasStudent: false,  // Inform frontend no student assigned yet
            // Don't send currentStudent here - admin must explicitly assign
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

        // Mark session as inactive (ESP32 will see status: "ended")
        session.active = false;
        session.hasStudent = false;  // Clear any pending student

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
 * Get current student for IoT device (ESP32 polling endpoint)
 * GET /api/iot/current/:sessionId
 * 
 * NO AUTH REQUIRED - ESP32 calls this directly
 * 
 * Response contract:
 * - status: "active" | "ended" | "done" | "no_session"
 * - hasStudent: true | false (only when status="active")
 * - Student fields ONLY when hasStudent=true
 */
exports.getCurrentStudent = async (req, res) => {
    try {
        const { sessionId } = req.params;

        console.log("[IOT] ESP32 polling for session:", sessionId);
        console.log("[IOT] Sessions in memory:", activeSessions.size);

        // Debug: List all session IDs
        console.log("[IOT] Available sessions:", [...activeSessions.keys()]);

        const session = activeSessions.get(sessionId);

        // Case: Session not found
        if (!session) {
            console.log("[IOT] ⚠️ Session NOT FOUND in memory!");
            return res.json({
                success: false,
                status: "no_session",
                hasStudent: false,
                message: "Session not found or ended",
            });
        }

        // Case: Session ended (admin clicked stop)
        if (!session.active) {
            return res.json({
                success: true,
                status: "ended",
                hasStudent: false,
                message: "Session has ended",
            });
        }

        // Case: All students processed
        if (session.currentIndex >= session.students.length) {
            return res.json({
                success: true,
                status: "done",
                hasStudent: false,
                message: "All students have been processed",
                summary: {
                    total: session.students.length,
                    present: Object.values(session.records).filter((s) => s === "present").length,
                    absent: Object.values(session.records).filter((s) => s === "absent").length,
                },
            });
        }

        // Case: Session active but NO student assigned (waiting for admin)
        // ESP32 should poll again after delay
        if (!session.hasStudent) {
            console.log("[IOT] Session active, waiting for admin to assign student");
            return res.json({
                success: true,
                status: "active",
                hasStudent: false,
                // 🔑 No student fields - ESP32 should wait and retry
            });
        }

        // Case: Session active AND student is ready for ESP32
        const currentStudent = session.students[session.currentIndex];
        console.log("[IOT] Serving student to ESP32:", currentStudent.name);

        res.json({
            success: true,
            status: "active",
            hasStudent: true,
            // Student fields included only when hasStudent=true
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
            status: "error",
            hasStudent: false,
            message: "Server error",
            error: err.message,
        });
    }
};

/**
 * Mark attendance from IoT device (ESP32 calls this)
 * POST /api/iot/mark
 * 
 * NO AUTH REQUIRED - ESP32 calls this directly
 * 
 * After marking:
 * - Records the attendance
 * - Sets hasStudent=false (ESP32 will wait)
 * - Advances currentIndex
 * - Session remains active
 */
exports.markAttendance = async (req, res) => {
    try {
        const { attendanceId, status } = req.body;

        console.log("[IOT] ESP32 marking attendance:", attendanceId, "status:", status);

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

        // Verify hasStudent is true (admin assigned this student)
        if (!session.hasStudent) {
            return res.status(400).json({
                success: false,
                message: "No student currently assigned. Wait for admin.",
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

        // ═══════════════════════════════════════════════════════════════════
        // STATE TRANSITION: Mark attendance and clear student
        // ═══════════════════════════════════════════════════════════════════

        // 1. Record the attendance
        session.records[studentId] = status;

        // 2. Move to next student index
        session.currentIndex++;

        // 3. 🔑 Clear hasStudent - ESP32 must wait for admin to assign next
        session.hasStudent = false;

        console.log(
            "[IOT] Marked", currentStudent.name, "as", status,
            "| Next index:", session.currentIndex,
            "| hasStudent: false (waiting for admin)"
        );

        // Check if we're done (all students processed)
        const isDone = session.currentIndex >= session.students.length;

        if (isDone) {
            return res.json({
                success: true,
                message: `Marked ${currentStudent.name} as ${status}`,
                status: "done",
                hasStudent: false,
                summary: {
                    total: session.students.length,
                    present: Object.values(session.records).filter((s) => s === "present").length,
                    absent: Object.values(session.records).filter((s) => s === "absent").length,
                },
            });
        }

        // Session continues, but ESP32 must wait for admin to assign next student
        res.json({
            success: true,
            message: `Marked ${currentStudent.name} as ${status}. Waiting for next student.`,
            status: "waiting",
            hasStudent: false,  // 🔑 ESP32 knows to wait
            position: session.currentIndex + 1,
            total: session.students.length,
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
 * Assign next student to ESP32 (Admin clicks "Next Student")
 * POST /api/iot/next
 * 
 * Sets hasStudent=true so ESP32 can see the student
 */
exports.nextStudent = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const teacherId = req.teacherId;

        console.log("[IOT] Admin requesting next student for session:", sessionId);

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

        // Check if all students are done
        if (session.currentIndex >= session.students.length) {
            return res.json({
                success: true,
                message: "All students have been processed",
                isDone: true,
                hasStudent: false,
            });
        }

        // Check if student is already assigned
        if (session.hasStudent) {
            const currentStudent = session.students[session.currentIndex];
            return res.json({
                success: true,
                message: "Student already assigned to ESP32",
                hasStudent: true,
                currentStudent: currentStudent,
                position: session.currentIndex + 1,
                total: session.students.length,
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // STATE TRANSITION: Assign student to ESP32
        // ═══════════════════════════════════════════════════════════════════
        session.hasStudent = true;
        const currentStudent = session.students[session.currentIndex];

        console.log("[IOT] Assigned student to ESP32:", currentStudent.name, "| hasStudent: true");

        res.json({
            success: true,
            message: `Student ${currentStudent.name} assigned to ESP32`,
            hasStudent: true,
            currentStudent: currentStudent,
            position: session.currentIndex + 1,
            total: session.students.length,
        });
    } catch (err) {
        console.error("[IOT] Next student error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};

/**
 * Get session status (Admin polling endpoint)
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
            hasStudent: session.hasStudent,  // 🔑 Include in status
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
 * 
 * Also clears hasStudent (admin must click "Next" again)
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

        // Mark as absent and advance
        session.records[currentStudent._id] = "absent";
        session.currentIndex++;
        session.hasStudent = false;  // 🔑 Clear - admin must click "Next" again

        console.log("[IOT] Skipped student:", currentStudent.name, "| hasStudent: false");

        const isDone = session.currentIndex >= session.students.length;

        res.json({
            success: true,
            message: `Skipped ${currentStudent.name} (marked as absent)`,
            isDone,
            hasStudent: false,
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
