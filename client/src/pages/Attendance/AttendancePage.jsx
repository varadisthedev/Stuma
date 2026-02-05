/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Attendance Page
 * Mark attendance for classes - select class, date, and mark students
 * Supports both manual and IoT device attendance modes
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { classesAPI, studentsAPI, attendanceAPI, iotAPI } from '../../services/api';
import { formatTime, toISODateString, formatDate } from '../../utils/helpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';

export default function AttendancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClassId = searchParams.get('classId');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '');
  const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));
  const [attendance, setAttendance] = useState({}); // { studentId: 'present' | 'absent' }
  const [selectAllMode, setSelectAllMode] = useState('present');

  // IoT Mode State
  const [isIoTMode, setIsIoTMode] = useState(false);
  const [iotSession, setIotSession] = useState(null); // { sessionId, totalStudents, currentStudent, ... }
  const [iotStatus, setIotStatus] = useState(null);
  const pollIntervalRef = useRef(null);

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadData();
    return () => {
      // Cleanup polling on unmount
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  /**
   * Poll IoT session status when active
   */
  useEffect(() => {
    if (iotSession?.sessionId && isIoTMode) {
      // Start polling
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await iotAPI.getSessionStatus(iotSession.sessionId);
          setIotStatus(status);
          
          // Check if session completed
          if (status.currentIndex >= status.totalStudents) {
            console.log('[IOT] Session completed');
          }
        } catch (err) {
          console.error('[IOT] Failed to poll status:', err);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [iotSession?.sessionId, isIoTMode]);

  /**
   * Fetch classes and students
   */
  const loadData = async () => {
    console.log('[ATTENDANCE] Loading data');
    setIsLoading(true);
    setError('');

    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll(),
        studentsAPI.getAll(),
      ]);

      console.log('[ATTENDANCE] Classes:', classesRes.classes?.length);
      console.log('[ATTENDANCE] Students:', studentsRes.count);

      setClasses(classesRes.classes || []);
      setStudents(studentsRes.students || []);

      // Initialize attendance (all present by default)
      const initialAttendance = {};
      (studentsRes.students || []).forEach((s) => {
        initialAttendance[s._id] = 'present';
      });
      setAttendance(initialAttendance);

    } catch (err) {
      console.error('[ATTENDANCE] Failed to load:', err);
      setError('Failed to load data.');
    }

    setIsLoading(false);
  };

  /**
   * Toggle student attendance status
   */
  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  /**
   * Mark all students with same status
   */
  const handleMarkAll = (status) => {
    console.log('[ATTENDANCE] Marking all students as:', status);
    const newAttendance = {};
    students.forEach((s) => {
      newAttendance[s._id] = status;
    });
    setAttendance(newAttendance);
    setSelectAllMode(status);
  };

  /**
   * Submit attendance (Manual Mode)
   */
  const handleSubmit = async () => {
    // Validation
    if (!selectedClassId) {
      setError('Please select a class');
      return;
    }

    if (!selectedDate) {
      setError('Please select a date');
      return;
    }

    if (students.length === 0) {
      setError('No students to mark attendance for');
      return;
    }

    setError('');
    setIsSubmitting(true);

    // Build records array
    const records = students.map((student) => ({
      student: student._id,
      status: attendance[student._id] || 'absent',
    }));

    const payload = {
      class: selectedClassId,
      date: selectedDate,
      records,
    };

    console.log('[ATTENDANCE] Submitting attendance:', payload);

    try {
      const response = await attendanceAPI.mark(payload);

      if (response.success) {
        console.log('[ATTENDANCE] Attendance marked successfully');
        setSuccess('Attendance marked successfully!');
        
        // Redirect to analytics after short delay
        setTimeout(() => {
          navigate(`/analytics?classId=${selectedClassId}`);
        }, 1500);
      }
    } catch (err) {
      console.error('[ATTENDANCE] Failed to submit:', err);
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }

    setIsSubmitting(false);
  };

  /**
   * Start IoT attendance session
   */
  const handleStartIoTSession = async () => {
    if (!selectedClassId) {
      setError('Please select a class first');
      return;
    }

    if (!selectedDate) {
      setError('Please select a date first');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await iotAPI.startSession(selectedClassId, selectedDate);
      
      if (response.success) {
        setIotSession(response);
        setIsIoTMode(true);
        setSuccess('IoT session started! ESP32 can now take attendance.');
        console.log('[IOT] Session started:', response.sessionId);
      }
    } catch (err) {
      console.error('[IOT] Failed to start session:', err);
      setError(err.response?.data?.message || 'Failed to start IoT session');
    }

    setIsSubmitting(false);
  };

  /**
   * Stop IoT session and save attendance
   */
  const handleStopIoTSession = async (saveProgress = true) => {
    if (!iotSession?.sessionId) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await iotAPI.stopSession(iotSession.sessionId, saveProgress);
      
      if (response.success) {
        setSuccess(saveProgress ? 'Attendance saved successfully!' : 'Session ended without saving.');
        setIotSession(null);
        setIotStatus(null);
        setIsIoTMode(false);

        if (saveProgress && response.attendanceId) {
          // Redirect to analytics
          setTimeout(() => {
            navigate(`/analytics?classId=${selectedClassId}`);
          }, 1500);
        }
      }
    } catch (err) {
      console.error('[IOT] Failed to stop session:', err);
      setError(err.response?.data?.message || 'Failed to stop session');
    }

    setIsSubmitting(false);
  };

  /**
   * Skip current student in IoT mode
   */
  const handleSkipStudent = async () => {
    if (!iotSession?.sessionId) return;

    try {
      const response = await iotAPI.skipStudent(iotSession.sessionId);
      if (response.success) {
        console.log('[IOT] Skipped student');
        // Status will update on next poll
      }
    } catch (err) {
      console.error('[IOT] Failed to skip student:', err);
      setError(err.response?.data?.message || 'Failed to skip student');
    }
  };

  /**
   * Assign next student to ESP32 (sets hasStudent=true)
   */
  const handleNextStudent = async () => {
    if (!iotSession?.sessionId) return;

    try {
      const response = await iotAPI.nextStudent(iotSession.sessionId);
      if (response.success) {
        console.log('[IOT] Assigned student to ESP32:', response.currentStudent?.name);
        // Status will update on next poll
      }
    } catch (err) {
      console.error('[IOT] Failed to assign next student:', err);
      setError(err.response?.data?.message || 'Failed to assign next student');
    }
  };

  /**
   * Get attendance summary
   */
  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;

  /**
   * Get selected class info
   */
  const selectedClass = classes.find((c) => c._id === selectedClassId);

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Check for prerequisites
  if (classes.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Mark Attendance</h1>
        </div>
        <div className="glass-card-static" style={{ padding: '2rem' }}>
          <EmptyState
            icon="◫"
            title="No classes available"
            message="You need to create classes before marking attendance"
            action={() => navigate('/classes')}
            actionLabel="Create a Class"
          />
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Mark Attendance</h1>
        </div>
        <div className="glass-card-static" style={{ padding: '2rem' }}>
          <EmptyState
            icon="◎"
            title="No students available"
            message="You need to add students before marking attendance"
            action={() => navigate('/students')}
            actionLabel="Add Students"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">
          {formatDate(new Date(selectedDate), { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Selection Card */}
      <div className="glass-card-static" style={styles.selectionCard}>
        <div style={styles.selectionGrid}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Class</label>
            <select
              className="form-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={isIoTMode}
            >
              <option value="">-- Choose a class --</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.subject} ({cls.day}, {formatTime(cls.startTime)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Date</label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={toISODateString(new Date())}
              disabled={isIoTMode}
            />
          </div>
        </div>

        {selectedClass && (
          <div style={styles.classInfo}>
            <span className="badge badge-primary">{selectedClass.day}</span>
            <span style={styles.classTime}>
              {formatTime(selectedClass.startTime)} - {formatTime(selectedClass.endTime)}
            </span>
          </div>
        )}
      </div>

      {/* Mode Toggle - IoT Device Option */}
      {!isIoTMode && (
        <div className="glass-card-static" style={styles.iotCard}>
          <div style={styles.iotHeader}>
            <div style={styles.iotIcon}>📡</div>
            <div style={styles.iotInfo}>
              <h3 style={styles.iotTitle}>IoT Device Attendance</h3>
              <p style={styles.iotDescription}>
                Use ESP32 device with touch sensor for automated attendance
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleStartIoTSession}
              disabled={isSubmitting || !selectedClassId}
              style={styles.iotButton}
            >
              {isSubmitting ? 'Starting...' : '🚀 Start IoT Session'}
            </button>
          </div>
        </div>
      )}

      {/* IoT Session Active Panel */}
      {isIoTMode && iotSession && (
        <div className="glass-card-static" style={styles.iotActiveCard}>
          <div style={styles.iotActiveHeader}>
            <div style={styles.pulseIndicator}>
              <span style={styles.pulseCircle}></span>
              <span style={styles.iotLiveText}>LIVE</span>
            </div>
            <h3 style={styles.iotActiveTitle}>IoT Session Active</h3>
          </div>

          {/* Session Info */}
          <div style={styles.sessionInfo}>
            <div style={styles.sessionIdBox}>
              <span style={styles.sessionLabel}>Session ID:</span>
              <code style={styles.sessionIdCode}>{iotSession.sessionId}</code>
            </div>
            <p style={styles.sessionHint}>
              ESP32 should call: <code>GET /api/iot/current/{iotSession.sessionId}</code>
            </p>
          </div>

          {/* Current Student Display */}
          {iotStatus && (
            <div style={styles.currentStudentCard}>
              {iotStatus.currentIndex >= iotStatus.totalStudents ? (
                /* All students processed */
                <div style={styles.completedMessage}>
                  ✅ All students processed!
                </div>
              ) : !iotStatus.hasStudent ? (
                /* Waiting for admin to assign next student */
                <div style={styles.waitingCard}>
                  <div style={styles.waitingIcon}>⏳</div>
                  <div style={styles.waitingText}>
                    Waiting to assign student to ESP32
                  </div>
                  <div style={styles.waitingHint}>
                    Click "Next Student" to send student #{iotStatus.currentIndex + 1} to ESP32
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleNextStudent}
                    style={styles.nextStudentButton}
                  >
                    ➡️ Next Student
                  </button>
                </div>
              ) : (
                /* Student assigned to ESP32 (hasStudent=true) */
                <>
                  <div style={styles.studentPosition}>
                    Student {iotStatus.currentIndex + 1} of {iotStatus.totalStudents}
                  </div>
                  <div style={styles.assignedBadge}>
                    📲 Sent to ESP32
                  </div>
                  <div style={styles.currentStudentName}>
                    {iotStatus.currentStudent?.name}
                  </div>
                  <div style={styles.currentStudentDetails}>
                    <span className="badge badge-primary">{iotStatus.currentStudent?.rollNo}</span>
                    <span style={styles.sectionBadge}>{iotStatus.currentStudent?.section}</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleSkipStudent}
                    style={styles.skipButton}
                  >
                    ⏭ Skip (Mark Absent)
                  </button>
                </>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {iotStatus && (
            <div style={styles.progressSection}>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${(iotStatus.currentIndex / iotStatus.totalStudents) * 100}%`
                  }}
                />
              </div>
              <div style={styles.progressStats}>
                <div style={styles.progressStat}>
                  <span style={{ color: '#22C55E' }}>✓ Present:</span>
                  <strong>{iotStatus.summary?.present || 0}</strong>
                </div>
                <div style={styles.progressStat}>
                  <span style={{ color: '#EF4444' }}>✗ Absent:</span>
                  <strong>{iotStatus.summary?.absent || 0}</strong>
                </div>
                <div style={styles.progressStat}>
                  <span style={{ color: '#6B7280' }}>⏳ Pending:</span>
                  <strong>{iotStatus.summary?.pending || 0}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Session Controls */}
          <div style={styles.sessionControls}>
            <button
              className="btn btn-success"
              onClick={() => handleStopIoTSession(true)}
              disabled={isSubmitting}
            >
              ✓ Save & End Session
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleStopIoTSession(false)}
              disabled={isSubmitting}
            >
              ✗ Cancel Session
            </button>
          </div>
        </div>
      )}

      {/* Manual Mode - Attendance Summary */}
      {!isIoTMode && (
        <>
          <div style={styles.summaryBar}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Total</span>
              <span style={styles.summaryValue}>{students.length}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryLabel, color: '#22C55E' }}>Present</span>
              <span style={{ ...styles.summaryValue, color: '#22C55E' }}>{presentCount}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryLabel, color: '#EF4444' }}>Absent</span>
              <span style={{ ...styles.summaryValue, color: '#EF4444' }}>{absentCount}</span>
            </div>
            <div style={styles.summaryActions}>
              <button
                className={`btn btn-sm ${selectAllMode === 'present' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => handleMarkAll('present')}
              >
                All Present
              </button>
              <button
                className={`btn btn-sm ${selectAllMode === 'absent' ? 'btn-danger' : 'btn-ghost'}`}
                onClick={() => handleMarkAll('absent')}
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Student List */}
          <div className="glass-card-static" style={styles.studentList}>
            {students.map((student, index) => {
              const isPresent = attendance[student._id] === 'present';
              return (
                <div
                  key={student._id}
                  style={{
                    ...styles.studentItem,
                    ...(isPresent ? styles.studentPresent : styles.studentAbsent),
                  }}
                  className="animate-fade-in"
                  onClick={() => toggleAttendance(student._id)}
                >
                  <div style={styles.studentInfo}>
                    <span className="badge badge-primary" style={styles.rollBadge}>
                      {student.rollNo}
                    </span>
                    <span style={styles.studentName}>{student.name}</span>
                  </div>
                  <div
                    style={{
                      ...styles.statusToggle,
                      ...(isPresent ? styles.statusPresent : styles.statusAbsent),
                    }}
                  >
                    {isPresent ? 'Present' : 'Absent'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div style={styles.submitSection}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedClassId}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm" style={{ borderTopColor: 'white' }}></span>
                  Submitting...
                </>
              ) : (
                `Submit Attendance (${presentCount}P / ${absentCount}A)`
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  selectionCard: {
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  selectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  classInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(180, 184, 197, 0.3)',
  },
  classTime: {
    color: '#6B7280',
    fontSize: '0.875rem',
  },
  // IoT Card Styles
  iotCard: {
    padding: '1.25rem',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, rgba(9, 65, 109, 0.05) 0%, rgba(219, 252, 255, 0.3) 100%)',
    border: '2px dashed rgba(9, 65, 109, 0.3)',
  },
  iotHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  iotIcon: {
    fontSize: '2rem',
  },
  iotInfo: {
    flex: 1,
    minWidth: '200px',
  },
  iotTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#09416D',
  },
  iotDescription: {
    margin: '0.25rem 0 0',
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  iotButton: {
    whiteSpace: 'nowrap',
  },
  // IoT Active Session Styles
  iotActiveCard: {
    padding: '1.5rem',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(219, 252, 255, 0.4) 100%)',
    border: '2px solid rgba(34, 197, 94, 0.4)',
  },
  iotActiveHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  pulseIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pulseCircle: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#22C55E',
    animation: 'pulseLive 1.5s ease-in-out infinite',
  },
  iotLiveText: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#22C55E',
    letterSpacing: '0.05em',
  },
  iotActiveTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1F2937',
  },
  sessionInfo: {
    marginBottom: '1rem',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '0.5rem',
  },
  sessionIdBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  sessionLabel: {
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  sessionIdCode: {
    padding: '0.25rem 0.5rem',
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '0.25rem',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    color: '#09416D',
  },
  sessionHint: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#9CA3AF',
  },
  currentStudentCard: {
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '0.75rem',
    textAlign: 'center',
    marginBottom: '1rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  },
  studentPosition: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '0.5rem',
  },
  currentStudentName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '0.5rem',
  },
  currentStudentDetails: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  sectionBadge: {
    padding: '0.25rem 0.75rem',
    background: '#F3F4F6',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  skipButton: {
    marginTop: '0.5rem',
  },
  // hasStudent waiting state styles
  waitingCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
  },
  waitingIcon: {
    fontSize: '2.5rem',
    opacity: 0.8,
  },
  waitingText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#6B7280',
  },
  waitingHint: {
    fontSize: '0.875rem',
    color: '#9CA3AF',
    marginBottom: '0.5rem',
  },
  nextStudentButton: {
    marginTop: '0.5rem',
    padding: '0.75rem 1.5rem',
  },
  assignedBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#16A34A',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  completedMessage: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#22C55E',
  },
  progressSection: {
    marginBottom: '1rem',
  },
  progressBar: {
    height: '8px',
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '0.75rem',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22C55E 0%, #4ADE80 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  progressStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.875rem',
  },
  sessionControls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  // Manual Mode Styles
  summaryBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '0.75rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1F2937',
  },
  summaryActions: {
    marginLeft: 'auto',
    display: 'flex',
    gap: '0.5rem',
  },
  studentList: {
    padding: '0.5rem',
  },
  studentItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '0.25rem',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    border: '2px solid transparent',
  },
  studentPresent: {
    background: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  studentAbsent: {
    background: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  studentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  rollBadge: {
    minWidth: '50px',
    textAlign: 'center',
  },
  studentName: {
    fontWeight: 500,
    color: '#1F2937',
  },
  statusToggle: {
    padding: '0.375rem 0.875rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  statusPresent: {
    background: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)',
    color: 'white',
  },
  statusAbsent: {
    background: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
    color: 'white',
  },
  submitSection: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  submitBtn: {
    minWidth: '280px',
  },
};

