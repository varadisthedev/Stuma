/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Classes Page
 * Manage timetable - view, add, and organize classes
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classesAPI, authAPI } from '../../services/api';
import { formatTime, groupBy } from '../../utils/helpers';
import { getHoliday, isCurrentSlot } from '../../utils/timetableUtils';
import { GridPageSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';

export default function ClassesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [volunteers, setVolunteers] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    day: 'Monday',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    assignedVolunteer: '',
    youtubeLink: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadClasses();
    loadVolunteers();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadVolunteers = async () => {
    try {
      const response = await authAPI.getVolunteers();
      setVolunteers(response.volunteers || []);
    } catch (err) {
      console.error('Failed to load volunteers:', err);
    }
  };

  const loadClasses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await classesAPI.getAll();
      setClasses(response.classes || []);
    } catch (err) {
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
    if (formData.startTime >= formData.endTime) {
      setFormError('End time must be after start time');
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await classesAPI.create(formData);
      if (response.success) {
        setSuccess('Class created successfully!');
        setIsModalOpen(false);
        setFormData({ subject: '', day: 'Monday', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '10:00', assignedVolunteer: '', youtubeLink: '' });
        loadClasses();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create class');
    }
    setIsSubmitting(false);
  };

  const currentWeekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentTime);
    const currentDay = d.getDay() || 7;
    d.setDate(d.getDate() - currentDay + 1 + (weekOffset * 7) + i);
    return d.toISOString().split('T')[0];
  });

  const classesByDate = groupBy(classes, 'date');
  const year = currentTime.getFullYear();
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const day = String(currentTime.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  if (isLoading) return <GridPageSkeleton />;

  const inputStyle = {
    width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827',
    fontSize: '0.9rem', borderRadius: '8px', padding: '10px 14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' };
  const fieldStyle = { marginBottom: '18px' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>Class Timetable</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', backgroundColor: '#b91d20' }}></div>
            <p style={{ color: '#b91d20', fontWeight: 700, margin: 0 }}>
              Live: {currentTime.toLocaleString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <button onClick={() => setWeekOffset(prev => prev - 1)} style={{ padding: '8px 16px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.875rem', color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>← Prev</button>
            <button onClick={() => setWeekOffset(0)} style={{ padding: '8px 16px', border: 'none', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', background: 'none', fontWeight: 700, fontSize: '0.875rem', color: '#111827', cursor: 'pointer', whiteSpace: 'nowrap' }}>This Week</button>
            <button onClick={() => setWeekOffset(prev => prev + 1)} style={{ padding: '8px 16px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.875rem', color: '#6B7280', cursor: 'pointer', whiteSpace: 'nowrap' }}>Next →</button>
          </div>
          <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(185,29,32,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Add Class
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Timetable Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px', marginBottom: '32px' }}>
        {currentWeekDates.map((dateStr) => {
          const dateObj = new Date(dateStr + 'T00:00:00');
          const displayDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayClasses = classesByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const holiday = getHoliday(dateStr);

          return (
            <div key={dateStr} style={{ background: 'white', border: isToday ? '2px solid #b91d20' : '1px solid #F3F4F6', borderRadius: '14px', display: 'flex', flexDirection: 'column', minHeight: '180px', overflow: 'hidden', boxShadow: isToday ? '0 4px 16px rgba(185,29,32,0.08)' : '0 1px 4px rgba(0,0,0,0.02)' }}>
              {/* Holiday indicator */}
              {holiday && (
                <div style={{ background: '#FEF9C3', borderBottom: '1px solid #FEF08A', padding: '3px 8px', fontSize: '0.5625rem', fontWeight: 700, color: '#854D0E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{holiday.emoji}</span> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{holiday.name}</span>
                </div>
              )}
              {/* Day header */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', background: isToday ? '#FFF5F5' : '#FAFAFA' }}>
                <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#111827', marginBottom: '2px' }}>{displayDay}</div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: isToday ? '#b91d20' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{displayDate}</span>
                  {dayClasses.length > 0 && <span style={{ background: isToday ? '#FEE2E2' : '#F3F4F6', padding: '1px 6px', borderRadius: '10px' }}>{dayClasses.length}</span>}
                </div>
              </div>

              {/* Classes */}
              <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayClasses.length > 0 ? (
                  dayClasses
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((cls) => {
                      const active = isCurrentSlot(dateStr, cls.startTime, cls.endTime, currentTime);
                      return (
                        <div key={cls._id} style={{ background: active ? '#FFF5F5' : '#FCFDFD', border: active ? '1.5px solid #b91d20' : '1px solid #F0F0F0', borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '3px', position: 'relative' }}>
                          {active && (
                            <div style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', background: '#b91d20', boxShadow: '0 0 0 2px rgba(185,29,32,0.25)' }} />
                          )}
                          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: active ? '#b91d20' : '#9CA3AF', letterSpacing: '0.02em' }}>
                            {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                          </div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cls.subject}
                          </div>
                          {cls.assignedVolunteer && (
                            <div style={{ fontSize: '0.625rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>person</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {typeof cls.assignedVolunteer === 'object' ? cls.assignedVolunteer.name : 'Unknown'}
                              </span>
                            </div>
                          )}
                          {cls.youtubeLink && (
                            <a href={cls.youtubeLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.625rem', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>smart_display</span>
                              Content
                            </a>
                          )}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                            <Link to={`/attendance?classId=${cls._id}`} style={{ flex: 1, background: '#FEF2F2', color: '#b91d20', border: '1px solid #FEE2E2', borderRadius: '5px', padding: '3px 4px', fontSize: '0.5625rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none', display: 'block' }}>Attendance</Link>
                            <Link to={`/analytics?classId=${cls._id}`} style={{ flex: 1, background: '#F9FAFB', color: '#6B7280', border: '1px solid #F3F4F6', borderRadius: '5px', padding: '3px 4px', fontSize: '0.5625rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none', display: 'block' }}>Analytics</Link>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#E5E7EB', fontSize: '0.75rem', fontWeight: 500 }}>—</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div style={{ background: 'white', borderRadius: '20px', padding: '64px 32px', border: '1px solid #F3F4F6', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '72px', height: '72px', background: '#FEF2F2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#b91d20' }}>event_busy</span>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: '12px' }}>No classes scheduled</h2>
          <p style={{ color: '#6B7280', marginBottom: '32px', maxWidth: '360px', margin: '0 auto 32px', lineHeight: 1.6 }}>Create your first class to get started with foundation tracking and schedules.</p>
          <button onClick={() => setIsModalOpen(true)} style={{ background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '12px 28px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            Create Schedule
          </button>
        </div>
      )}

      {/* Add Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>Add New Class</span>}
        footer={
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} type="button" style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} type="submit" style={{ flex: 1, background: '#b91d20', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Creating...' : 'Confirm Schedule'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit}>
          {formError && <Alert type="error" message={formError} />}

          <div style={fieldStyle}>
            <label style={labelStyle}>Subject Name</label>
            <input type="text" name="subject" style={inputStyle} placeholder="e.g., Mathematics, Physics" value={formData.subject} onChange={handleInputChange} required minLength={2} />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '18px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Day of Week</label>
              <select name="day" style={inputStyle} value={formData.day} onChange={handleInputChange} required>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date</label>
              <input type="date" name="date" style={inputStyle} value={formData.date} onChange={handleInputChange} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '18px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start Time</label>
              <input type="time" name="startTime" style={inputStyle} value={formData.startTime} onChange={handleInputChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End Time</label>
              <input type="time" name="endTime" style={inputStyle} value={formData.endTime} onChange={handleInputChange} required />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Assign Volunteer</label>
            <select name="assignedVolunteer" style={inputStyle} value={formData.assignedVolunteer} onChange={handleInputChange}>
              <option value="">No volunteer assigned</option>
              {volunteers.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>YouTube Content Link</label>
            <input type="url" name="youtubeLink" style={inputStyle} placeholder="https://youtube.com/watch?v=..." value={formData.youtubeLink} onChange={handleInputChange} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
