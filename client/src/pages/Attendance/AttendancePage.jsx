/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Attendance Page
 * Mark attendance for classes - select class, date, and mark students
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { classesAPI, studentsAPI, attendanceAPI } from '../../services/api';
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

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadData();
  }, []);

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
   * Submit attendance
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

      {/* Attendance Summary */}
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
