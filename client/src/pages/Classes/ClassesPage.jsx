/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Classes Page - Dark Mode Compatible
 * Manage timetable - view, add, and organize classes
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classesAPI } from '../../services/api';
import { formatTime, getDaysOfWeek, groupBy } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

// Dynamic colors based on theme
const getColors = (isDark) => ({
  primary: isDark ? '#60A5FA' : '#09416D',
  primaryLight: isDark ? '#93C5FD' : '#0A5A94',
  accent: isDark ? '#6366F1' : '#DBFCFF',
  accentBorder: isDark ? '#818CF8' : '#A8E8EF',
  cardBg: isDark ? '#1E293B' : 'rgba(255, 255, 255, 0.65)',
  cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
  itemBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(180, 184, 197, 0.1)',
  itemHover: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(180, 184, 197, 0.2)',
  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(180, 184, 197, 0.3)',
  textPrimary: isDark ? '#F1F5F9' : '#1F2937',
  textSecondary: isDark ? '#CBD5E1' : '#4B5563',
  textMuted: isDark ? '#94A3B8' : '#6B7280',
  textLight: isDark ? '#64748B' : '#9CA3AF',
});

export default function ClassesPage() {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    console.log('[CLASSES] Loading classes');
    setIsLoading(true);
    setError('');

    try {
      const response = await classesAPI.getAll();
      console.log('[CLASSES] Loaded:', response.classes?.length, 'classes');
      setClasses(response.classes || []);
    } catch (err) {
      console.error('[CLASSES] Failed to load:', err);
      setError('Failed to load classes.');
    }

    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    console.log('[CLASSES] Creating class:', formData);

    if (formData.startTime >= formData.endTime) {
      setFormError('End time must be after start time');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await classesAPI.create(formData);
      
      if (response.success) {
        console.log('[CLASSES] Class created successfully');
        setSuccess('Class created successfully!');
        setIsModalOpen(false);
        setFormData({
          subject: '',
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:00',
        });
        loadClasses();
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('[CLASSES] Failed to create:', err);
      setFormError(err.response?.data?.message || 'Failed to create class');
    }

    setIsSubmitting(false);
  };

  const classesByDay = groupBy(classes, 'day');
  const days = getDaysOfWeek();

  const styles = getStyles(COLORS, isDarkMode);

  if (isLoading) {
    return <LoadingSpinner message="Loading classes..." />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={styles.header}>
        <div>
          <h1 className="page-title">Class Timetable</h1>
          <p className="page-subtitle">Manage your weekly class schedule</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Class
        </button>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Empty State */}
      {classes.length === 0 ? (
        <div style={styles.emptyCard}>
          <EmptyState
            icon="◫"
            title="No classes yet"
            message="Create your first class to get started with attendance tracking"
            action={() => setIsModalOpen(true)}
            actionLabel="Add Your First Class"
          />
        </div>
      ) : (
        /* Timetable Grid */
        <div style={styles.timetableGrid}>
          {days.map((day) => (
            <div key={day} style={styles.dayCard}>
              <div style={styles.dayHeader}>
                <h3 style={styles.dayName}>{day}</h3>
                <span style={styles.classCount}>
                  {classesByDay[day]?.length || 0} class{(classesByDay[day]?.length || 0) !== 1 ? 'es' : ''}
                </span>
              </div>
              
              {classesByDay[day]?.length > 0 ? (
                <div style={styles.classList}>
                  {classesByDay[day]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((cls) => (
                      <div key={cls._id} style={styles.classItem}>
                        <div style={styles.classTime}>
                          {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                        </div>
                        <div style={styles.classSubject}>{cls.subject}</div>
                        <div style={styles.classActions}>
                          <Link 
                            to={`/attendance?classId=${cls._id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Attendance
                          </Link>
                          <Link 
                            to={`/analytics?classId=${cls._id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Analytics
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div style={styles.emptyDay}>
                  <span style={styles.emptyDayText}>No classes</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Class"
        footer={
          <>
            <button 
              className="btn btn-ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Class'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <Alert type="error" message={formError} />}
          
          <div className="form-group">
            <label className="form-label">Subject Name</label>
            <input
              type="text"
              name="subject"
              className="form-input"
              placeholder="e.g., Mathematics, Physics"
              value={formData.subject}
              onChange={handleInputChange}
              required
              minLength={2}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Day of Week</label>
            <select
              name="day"
              className="form-select"
              value={formData.day}
              onChange={handleInputChange}
              required
            >
              {days.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div style={styles.timeRow}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Time</label>
              <input
                type="time"
                name="startTime"
                className="form-input"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Time</label>
              <input
                type="time"
                name="endTime"
                className="form-input"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const getStyles = (COLORS, isDark) => ({
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  timetableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
  },
  dayCard: {
    padding: '1.25rem',
    background: COLORS.cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '1rem',
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(9, 65, 109, 0.12)',
  },
  emptyCard: {
    padding: '2rem',
    background: COLORS.cardBg,
    backdropFilter: 'blur(16px)',
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '1rem',
  },
  dayHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: `1px solid ${COLORS.borderColor}`,
  },
  dayName: {
    fontSize: '1rem',
    fontWeight: 600,
    color: COLORS.primary,
    margin: 0,
  },
  classCount: {
    fontSize: '0.75rem',
    color: COLORS.textMuted,
  },
  classList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  classItem: {
    padding: '0.875rem',
    background: COLORS.itemBg,
    borderRadius: '0.5rem',
    transition: 'all 150ms ease',
  },
  classTime: {
    fontSize: '0.75rem',
    color: COLORS.textMuted,
    marginBottom: '0.25rem',
  },
  classSubject: {
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginBottom: '0.5rem',
  },
  classActions: {
    display: 'flex',
    gap: '0.25rem',
  },
  emptyDay: {
    padding: '1.5rem',
    textAlign: 'center',
  },
  emptyDayText: {
    color: COLORS.textLight,
    fontSize: '0.875rem',
  },
  timeRow: {
    display: 'flex',
    gap: '1rem',
  },
});
