/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Attendance Page - Dark Mode Compatible
 * Mark attendance for classes - select class, date, and mark students
 * Supports both manual and IoT device attendance modes
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { classesAPI, studentsAPI, attendanceAPI, iotAPI } from '../../services/api';
import { formatTime, toISODateString, formatDate } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';

// Dynamic colors based on theme
const getColors = (isDark) => ({
  primary: isDark ? '#60A5FA' : '#09416D',
  primaryLight: isDark ? '#93C5FD' : '#0A5A94',
  accent: isDark ? '#6366F1' : '#DBFCFF',
  accentBorder: isDark ? '#818CF8' : '#A8E8EF',
  success: '#22C55E',
  successLight: '#4ADE80',
  danger: '#EF4444',
  dangerLight: '#F87171',
  cardBg: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.65)',
  cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
  surfaceBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)',
  surfaceAlt: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(180, 184, 197, 0.3)',
  textPrimary: isDark ? '#F1F5F9' : '#1F2937',
  textSecondary: isDark ? '#CBD5E1' : '#4B5563',
  textMuted: isDark ? '#94A3B8' : '#6B7280',
  textLight: isDark ? '#64748B' : '#9CA3AF',
  inputBg: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
  iotBg: isDark 
    ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(99, 102, 241, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(9, 65, 109, 0.05) 0%, rgba(219, 252, 255, 0.3) 100%)',
  iotActiveBg: isDark
    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(99, 102, 241, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(219, 252, 255, 0.4) 100%)',
  summaryBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)',
});

export default function AttendancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClassId = searchParams.get('classId');
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '');
  const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));
  const [attendance, setAttendance] = useState({});
  const [selectAllMode, setSelectAllMode] = useState('present');

  // IoT Mode State
  const [isIoTMode, setIsIoTMode] = useState(false);
  const [iotSession, setIotSession] = useState(null);
  const [iotStatus, setIotStatus] = useState(null);
  const pollIntervalRef = useRef(null);
  
  const [autoNextEnabled, setAutoNextEnabled] = useState(false);
  const autoNextIntervalRef = useRef(null);

  useEffect(() => {
    loadData();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (autoNextIntervalRef.current) clearInterval(autoNextIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (iotSession?.sessionId && isIoTMode) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await iotAPI.getSessionStatus(iotSession.sessionId);
          setIotStatus(status);
        } catch (err) {
          console.error('[IOT] Failed to poll status:', err);
        }
      }, 2000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [iotSession?.sessionId, isIoTMode]);

  useEffect(() => {
    if (autoNextEnabled && isIoTMode && iotSession?.sessionId) {
      autoNextIntervalRef.current = setInterval(async () => {
        if (iotStatus && !iotStatus.hasStudent && iotStatus.currentIndex < iotStatus.totalStudents) {
          try {
            await iotAPI.nextStudent(iotSession.sessionId);
          } catch (err) {
            console.error('[IOT] Auto-Next failed:', err);
          }
        }
      }, 6000);
    }

    return () => {
      if (autoNextIntervalRef.current) {
        clearInterval(autoNextIntervalRef.current);
        autoNextIntervalRef.current = null;
      }
    };
  }, [autoNextEnabled, isIoTMode, iotSession?.sessionId, iotStatus?.hasStudent, iotStatus?.currentIndex, iotStatus?.totalStudents]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll(),
        studentsAPI.getAll(),
      ]);

      setClasses(classesRes.classes || []);
      setStudents(studentsRes.students || []);

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

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const handleMarkAll = (status) => {
    const newAttendance = {};
    students.forEach((s) => {
      newAttendance[s._id] = status;
    });
    setAttendance(newAttendance);
    setSelectAllMode(status);
  };

  const handleSubmit = async () => {
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

    const records = students.map((student) => ({
      student: student._id,
      status: attendance[student._id] || 'absent',
    }));

    try {
      const response = await attendanceAPI.mark({
        class: selectedClassId,
        date: selectedDate,
        records,
      });

      if (response.success) {
        setSuccess('Attendance marked successfully!');
        setTimeout(() => {
          navigate(`/analytics?classId=${selectedClassId}`);
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    }

    setIsSubmitting(false);
  };

  const handleStartIoTSession = async () => {
    if (!selectedClassId || !selectedDate) {
      setError('Please select a class and date first');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await iotAPI.startSession(selectedClassId, selectedDate);
      if (response.success) {
        setIotSession(response);
        setIsIoTMode(true);
        setSuccess('IoT session started!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start IoT session');
    }

    setIsSubmitting(false);
  };

  const handleStopIoTSession = async (saveProgress = true) => {
    if (!iotSession?.sessionId) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await iotAPI.stopSession(iotSession.sessionId, saveProgress);
      if (response.success) {
        setSuccess(saveProgress ? 'Attendance saved!' : 'Session ended.');
        setIotSession(null);
        setIotStatus(null);
        setIsIoTMode(false);
        setAutoNextEnabled(false);

        if (saveProgress && response.attendanceId) {
          setTimeout(() => navigate(`/analytics?classId=${selectedClassId}`), 1500);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop session');
    }

    setIsSubmitting(false);
  };

  const handleSkipStudent = async () => {
    if (!iotSession?.sessionId) return;
    try {
      await iotAPI.skipStudent(iotSession.sessionId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to skip student');
    }
  };

  const handleNextStudent = async () => {
    if (!iotSession?.sessionId) return;
    try {
      await iotAPI.nextStudent(iotSession.sessionId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign next student');
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const selectedClass = classes.find((c) => c._id === selectedClassId);

  const styles = getStyles(COLORS, isDarkMode);

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (classes.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Mark Attendance</h1>
        </div>
        <div style={styles.emptyCard}>
          <EmptyState
            icon="◫"
            title="No classes available"
            message="Create classes before marking attendance"
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
        <div style={styles.emptyCard}>
          <EmptyState
            icon="◎"
            title="No students available"
            message="Add students before marking attendance"
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
      <div style={styles.selectionCard}>
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

      {/* IoT Card */}
      {!isIoTMode && (
        <div style={styles.iotCard}>
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
            >
              {isSubmitting ? 'Starting...' : '🚀 Start IoT Session'}
            </button>
          </div>
        </div>
      )}

      {/* IoT Active Session */}
      {isIoTMode && iotSession && (
        <div style={styles.iotActiveCard}>
          <div style={styles.iotActiveHeader}>
            <div style={styles.pulseIndicator}>
              <span style={styles.pulseCircle}></span>
              <span style={styles.iotLiveText}>LIVE</span>
            </div>
            <h3 style={styles.iotActiveTitle}>IoT Session Active</h3>
          </div>

          <div style={styles.sessionInfo}>
            <div style={styles.sessionIdBox}>
              <span style={styles.sessionLabel}>Session ID:</span>
              <code style={styles.sessionIdCode}>{iotSession.sessionId}</code>
            </div>
            
            <div style={styles.autoNextToggle}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={autoNextEnabled}
                  onChange={(e) => setAutoNextEnabled(e.target.checked)}
                  style={styles.toggleCheckbox}
                />
                <span style={styles.toggleSwitch}>
                  <span style={{
                    ...styles.toggleSlider,
                    transform: autoNextEnabled ? 'translateX(20px)' : 'translateX(0)',
                    background: autoNextEnabled ? '#22C55E' : COLORS.textLight,
                  }} />
                </span>
                <span style={styles.toggleText}>
                  🔄 Auto-Next {autoNextEnabled ? '(ON)' : '(OFF)'}
                </span>
              </label>
            </div>
          </div>

          {iotStatus && (
            <div style={styles.currentStudentCard}>
              {iotStatus.currentIndex >= iotStatus.totalStudents ? (
                <div style={styles.completedMessage}>✅ All students processed!</div>
              ) : !iotStatus.hasStudent ? (
                <div style={styles.waitingCard}>
                  <div style={styles.waitingIcon}>⏳</div>
                  <div style={styles.waitingText}>Waiting to assign student</div>
                  <button className="btn btn-primary" onClick={handleNextStudent}>
                    ➡️ Next Student
                  </button>
                </div>
              ) : (
                <>
                  <div style={styles.studentPosition}>
                    Student {iotStatus.currentIndex + 1} of {iotStatus.totalStudents}
                  </div>
                  <div style={styles.assignedBadge}>📲 Sent to ESP32</div>
                  <div style={styles.currentStudentName}>{iotStatus.currentStudent?.name}</div>
                  <div style={styles.currentStudentDetails}>
                    <span className="badge badge-primary">{iotStatus.currentStudent?.rollNo}</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={handleSkipStudent}>
                    ⏭ Skip
                  </button>
                </>
              )}
            </div>
          )}

          {iotStatus && (
            <div style={styles.progressSection}>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${(iotStatus.currentIndex / iotStatus.totalStudents) * 100}%`
                }} />
              </div>
              <div style={styles.progressStats}>
                <span style={{ color: COLORS.success }}>✓ {iotStatus.summary?.present || 0}</span>
                <span style={{ color: COLORS.danger }}>✗ {iotStatus.summary?.absent || 0}</span>
                <span style={{ color: COLORS.textMuted }}>⏳ {iotStatus.summary?.pending || 0}</span>
              </div>
            </div>
          )}

          <div style={styles.sessionControls}>
            <button className="btn btn-success" onClick={() => handleStopIoTSession(true)} disabled={isSubmitting}>
              ✓ Save & End
            </button>
            <button className="btn btn-danger" onClick={() => handleStopIoTSession(false)} disabled={isSubmitting}>
              ✗ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {!isIoTMode && (
        <>
          <div style={styles.summaryBar}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Total</span>
              <span style={styles.summaryValue}>{students.length}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryLabel, color: COLORS.success }}>Present</span>
              <span style={{ ...styles.summaryValue, color: COLORS.success }}>{presentCount}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryLabel, color: COLORS.danger }}>Absent</span>
              <span style={{ ...styles.summaryValue, color: COLORS.danger }}>{absentCount}</span>
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

          <div style={styles.studentList}>
            {students.map((student) => {
              const isPresent = attendance[student._id] === 'present';
              return (
                <div
                  key={student._id}
                  style={{
                    ...styles.studentItem,
                    ...(isPresent ? styles.studentPresent : styles.studentAbsent),
                  }}
                  onClick={() => toggleAttendance(student._id)}
                >
                  <div style={styles.studentInfo}>
                    <span className="badge badge-primary" style={styles.rollBadge}>
                      {student.rollNo}
                    </span>
                    <span style={styles.studentName}>{student.name}</span>
                  </div>
                  <div style={{
                    ...styles.statusToggle,
                    ...(isPresent ? styles.statusPresent : styles.statusAbsent),
                  }}>
                    {isPresent ? 'Present' : 'Absent'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.submitSection}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedClassId}
              style={styles.submitBtn}
            >
              {isSubmitting ? 'Submitting...' : `Submit (${presentCount}P / ${absentCount}A)`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const getStyles = (COLORS, isDark) => ({
  emptyCard: {
    padding: '2rem',
    background: COLORS.cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '1rem',
  },
  selectionCard: {
    padding: '1.25rem',
    marginBottom: '1rem',
    background: COLORS.cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '1rem',
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
    borderTop: `1px solid ${COLORS.borderColor}`,
  },
  classTime: {
    color: COLORS.textMuted,
    fontSize: '0.875rem',
  },
  iotCard: {
    padding: '1.25rem',
    marginBottom: '1rem',
    background: COLORS.iotBg,
    border: `2px dashed ${isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(9, 65, 109, 0.3)'}`,
    borderRadius: '1rem',
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
    color: COLORS.primary,
  },
  iotDescription: {
    margin: '0.25rem 0 0',
    fontSize: '0.875rem',
    color: COLORS.textMuted,
  },
  iotActiveCard: {
    padding: '1.5rem',
    marginBottom: '1rem',
    background: COLORS.iotActiveBg,
    border: `2px solid rgba(34, 197, 94, 0.4)`,
    borderRadius: '1rem',
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
  },
  iotActiveTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600,
    color: COLORS.textPrimary,
  },
  sessionInfo: {
    marginBottom: '1rem',
    padding: '0.75rem',
    background: COLORS.surfaceBg,
    borderRadius: '0.5rem',
  },
  sessionIdBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  sessionLabel: {
    fontSize: '0.875rem',
    color: COLORS.textMuted,
  },
  sessionIdCode: {
    padding: '0.25rem 0.5rem',
    background: COLORS.inputBg,
    borderRadius: '0.25rem',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    color: COLORS.primary,
  },
  autoNextToggle: {
    paddingTop: '0.75rem',
    borderTop: `1px solid ${COLORS.borderColor}`,
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
  },
  toggleCheckbox: {
    display: 'none',
  },
  toggleSwitch: {
    position: 'relative',
    width: '44px',
    height: '24px',
    background: isDark ? '#334155' : '#E5E7EB',
    borderRadius: '12px',
  },
  toggleSlider: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    transition: 'transform 0.2s ease, background 0.2s ease',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
  },
  toggleText: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: COLORS.textSecondary,
  },
  currentStudentCard: {
    padding: '1.5rem',
    background: COLORS.surfaceAlt,
    borderRadius: '0.75rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  studentPosition: {
    fontSize: '0.875rem',
    color: COLORS.textMuted,
    marginBottom: '0.5rem',
  },
  currentStudentName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: COLORS.textPrimary,
    marginBottom: '0.5rem',
  },
  currentStudentDetails: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  waitingCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  waitingIcon: {
    fontSize: '2.5rem',
    opacity: 0.8,
  },
  waitingText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: COLORS.textMuted,
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
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  sessionControls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  summaryBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '1rem 1.5rem',
    background: COLORS.summaryBg,
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
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: COLORS.textPrimary,
  },
  summaryActions: {
    marginLeft: 'auto',
    display: 'flex',
    gap: '0.5rem',
  },
  studentList: {
    padding: '0.5rem',
    background: COLORS.cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '1rem',
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
    background: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  studentAbsent: {
    background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
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
    color: COLORS.textPrimary,
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
});
