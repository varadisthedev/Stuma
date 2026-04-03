/**
 * AttendancePage — works for both admin and volunteers
 * Clean inline-styles matching the Stuma design system
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { classesAPI, studentsAPI, attendanceAPI, iotAPI } from '../../services/api';
import { formatTime, toISODateString } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { ListPageSkeleton } from '../../components/ui/Skeleton';
import Alert from '../../components/ui/Alert';

const RED = '#b91d20';
const card = { background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)' };
const inputStyle = { width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827', fontSize: '0.875rem', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '6px' };

export default function AttendancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClassId = searchParams.get('classId');

  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  const isVolunteer = currentUser?.role === 'volunteer';
  const myId = currentUser?._id || currentUser?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || '');
  const [selectedDate, setSelectedDate] = useState(toISODateString(new Date()));
  const [attendance, setAttendance] = useState({});
  const [sessionNote, setSessionNote] = useState('');

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
          console.error('[IOT] Poll error:', err);
        }
      }, 2000);
    }
    return () => {
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    };
  }, [iotSession?.sessionId, isIoTMode]);

  useEffect(() => {
    if (autoNextEnabled && isIoTMode && iotSession?.sessionId) {
      autoNextIntervalRef.current = setInterval(async () => {
        if (iotStatus && !iotStatus.hasStudent && iotStatus.currentIndex < iotStatus.totalStudents) {
          try { await iotAPI.nextStudent(iotSession.sessionId); } catch (err) {}
        }
      }, 6000);
    }
    return () => {
      if (autoNextIntervalRef.current) { clearInterval(autoNextIntervalRef.current); autoNextIntervalRef.current = null; }
    };
  }, [autoNextEnabled, isIoTMode, iotSession?.sessionId, iotStatus?.hasStudent, iotStatus?.currentIndex]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll(),
        studentsAPI.getAll(),
      ]);

      const allCls = classesRes.classes || [];
      // volunteers only see their assigned classes
      const myCls = isVolunteer
        ? allCls.filter(c => c.assignedVolunteer && (c.assignedVolunteer._id === myId || c.assignedVolunteer === myId))
        : allCls;

      setAllClasses(myCls);
      const studs = studentsRes.students || [];
      setStudents(studs);
      const init = {};
      studs.forEach(s => { init[s._id] = 'present'; });
      setAttendance(init);
    } catch (err) {
      console.error('[ATTENDANCE] Load error:', err);
      setError('Failed to load data. Please refresh.');
    }
    setIsLoading(false);
  };

  const toggleAttendance = (id) => {
    setAttendance(prev => ({ ...prev, [id]: prev[id] === 'present' ? 'absent' : 'present' }));
  };

  const markAll = (status) => {
    const next = {};
    students.forEach(s => { next[s._id] = status; });
    setAttendance(next);
  };

  const handleSubmit = async () => {
    if (!selectedClassId) { setError('Please select a class'); return; }
    if (!selectedDate) { setError('Please select a date'); return; }
    if (students.length === 0) { setError('No students available'); return; }
    setError('');
    setIsSubmitting(true);
    const records = students.map(s => ({ student: s._id, status: attendance[s._id] || 'absent' }));
    try {
      const res = await attendanceAPI.mark({ class: selectedClassId, date: selectedDate, note: sessionNote.trim(), records });
      if (res.success) {
        setSuccess('✅ Attendance marked successfully!');
        setTimeout(() => navigate(`/analytics?classId=${selectedClassId}`), 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance.');
    }
    setIsSubmitting(false);
  };

  const handleStartIoT = async () => {
    if (!selectedClassId || !selectedDate) { setError('Select a class and date first'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      const res = await iotAPI.startSession(selectedClassId, selectedDate);
      if (res.success) { setIotSession(res); setIsIoTMode(true); }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start IoT session');
    }
    setIsSubmitting(false);
  };

  const handleStopIoT = async (save = true) => {
    if (!iotSession?.sessionId) return;
    setIsSubmitting(true);
    try {
      const res = await iotAPI.stopSession(iotSession.sessionId, save);
      if (res.success) {
        setSuccess(save ? '✅ Attendance saved!' : 'Session ended.');
        setIotSession(null); setIotStatus(null); setIsIoTMode(false); setAutoNextEnabled(false);
        if (save && res.attendanceId) setTimeout(() => navigate(`/analytics?classId=${selectedClassId}`), 1500);
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to stop session'); }
    setIsSubmitting(false);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const selectedClass = allClasses.find(c => c._id === selectedClassId);

  if (isLoading) return <ListPageSkeleton />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>Mark Attendance</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', background: RED }} />
            <p style={{ color: '#6B7280', fontWeight: 500, margin: 0 }}>
              {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a class to begin'}
            </p>
          </div>
        </div>
        {isVolunteer && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: RED }}>assignment_ind</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: RED }}>Volunteer Mode</span>
          </div>
        )}
      </div>

      {error && <div style={{ marginBottom: '16px' }}><Alert type="error" message={error} /></div>}
      {success && <div style={{ marginBottom: '16px' }}><Alert type="success" message={success} /></div>}

      {/* Class & Date Selector */}
      <div style={{ ...card, padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px 0' }}>Session Setup</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Select Class *</label>
            <select
              style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px', cursor: 'pointer' }}
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              disabled={isIoTMode}
            >
              <option value="">-- Choose a class --</option>
              {allClasses.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.subject} ({cls.day}, {formatTime(cls.startTime)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date *</label>
            <input
              type="date"
              style={inputStyle}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={toISODateString(new Date())}
              disabled={isIoTMode}
            />
          </div>
        </div>

        {selectedClass && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ background: '#FEF2F2', color: RED, fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>{selectedClass.day}</span>
            <span style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: 500 }}>
              {formatTime(selectedClass.startTime)} – {formatTime(selectedClass.endTime)}
            </span>
            {selectedClass.subject && (
              <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: 700 }}>{selectedClass.subject}</span>
            )}
          </div>
        )}

        {allClasses.length === 0 && (
          <div style={{ marginTop: '12px', padding: '16px', background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '8px', fontSize: '0.875rem', color: '#92400E' }}>
            ⚠️ {isVolunteer ? 'You have no assigned classes yet.' : 'No classes created yet. Create classes first.'}
          </div>
        )}
      </div>

      {/* IoT Integration Section */}
      {!isIoTMode && (
        <div style={{ ...card, padding: '20px', marginBottom: '20px', border: '1.5px dashed #E5E7EB', background: 'linear-gradient(135deg, #f8faff 0%, #fef9ff 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>📡</div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9375rem', marginBottom: '2px' }}>IoT Device Attendance</div>
              <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Use ESP32 + touch sensor for automated roll call</div>
            </div>
            <button
              onClick={handleStartIoT}
              disabled={isSubmitting || !selectedClassId || !selectedDate}
              style={{ background: selectedClassId ? '#1D4ED8' : '#E5E7EB', color: selectedClassId ? 'white' : '#9CA3AF', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 700, fontSize: '0.875rem', cursor: selectedClassId ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', boxShadow: selectedClassId ? '0 2px 8px rgba(29,78,216,0.25)' : 'none' }}
            >
              {isSubmitting ? 'Starting...' : '🚀 Start IoT Session'}
            </button>
          </div>
        </div>
      )}

      {/* IoT Active Session */}
      {isIoTMode && iotSession && (
        <div style={{ ...card, padding: '24px', marginBottom: '20px', border: '2px solid rgba(34,197,94,0.4)', background: 'linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(16,185,129,0.03) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)', display: 'inline-block' }} />
            <h3 style={{ margin: 0, fontWeight: 800, color: '#111827' }}>IoT Session Active</h3>
            <span style={{ marginLeft: 'auto', background: '#F0FDF4', color: '#16A34A', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' }}>LIVE</span>
          </div>

          <div style={{ background: '#F9FAFB', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '0.875rem', color: '#6B7280' }}>
            Session ID: <strong style={{ color: '#111827' }}>{iotSession.sessionId}</strong>
          </div>

          {/* Auto-next toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '20px', userSelect: 'none' }}>
            <div
              onClick={() => setAutoNextEnabled(p => !p)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', background: autoNextEnabled ? '#22C55E' : '#D1D5DB', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}
            >
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: autoNextEnabled ? '22px' : '2px', transition: 'left 200ms', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Auto-Next {autoNextEnabled ? '(ON)' : '(OFF)'}</span>
          </label>

          {iotStatus && (
            <>
              {/* Progress bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>{iotStatus.currentIndex} / {iotStatus.totalStudents} processed</span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span style={{ color: '#16A34A' }}>✓ {iotStatus.summary?.present || 0}</span>
                    <span style={{ color: RED }}>✗ {iotStatus.summary?.absent || 0}</span>
                  </div>
                </div>
                <div style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(iotStatus.currentIndex / Math.max(iotStatus.totalStudents, 1)) * 100}%`, background: 'linear-gradient(90deg, #22C55E, #4ADE80)', borderRadius: '4px', transition: 'width 300ms ease' }} />
                </div>
              </div>

              {/* Current student card */}
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
                {iotStatus.currentIndex >= iotStatus.totalStudents ? (
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16A34A' }}>✅ All students processed!</div>
                ) : !iotStatus.hasStudent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '2.5rem' }}>⏳</span>
                    <div style={{ fontWeight: 600, color: '#6B7280' }}>Waiting to assign student</div>
                    <button onClick={async () => { try { await iotAPI.nextStudent(iotSession.sessionId); } catch(e) {} }} style={{ background: RED, color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>➡️ Next Student</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '4px' }}>Student {iotStatus.currentIndex + 1} of {iotStatus.totalStudents}</div>
                    <div style={{ background: '#F0FDF4', color: '#16A34A', fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' }}>📲 Sent to ESP32</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{iotStatus.currentStudent?.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ background: '#FEF2F2', color: RED, fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '8px' }}>Roll #{iotStatus.currentStudent?.rollNo}</span>
                    </div>
                    <button onClick={async () => { try { await iotAPI.skipStudent(iotSession.sessionId); } catch(e) {} }} style={{ marginTop: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: '8px', padding: '6px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem' }}>⏭ Skip</button>
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => handleStopIoT(true)} disabled={isSubmitting} style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              ✓ Save & End Session
            </button>
            <button onClick={() => handleStopIoT(false)} disabled={isSubmitting} style={{ background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
              ✗ Cancel Session
            </button>
          </div>
        </div>
      )}

      {/* Manual Attendance */}
      {!isIoTMode && (
        <>
          {students.length === 0 ? (
            <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: '#FEF2F2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>👥</div>
              <h3 style={{ fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No students available</h3>
              <p style={{ color: '#6B7280', margin: 0 }}>Add students from the Students tab before marking attendance.</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div style={{ ...card, padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
                  {[
                    { label: 'Total', value: students.length, color: '#374151' },
                    { label: 'Present', value: presentCount, color: '#16A34A' },
                    { label: 'Absent', value: absentCount, color: RED },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => markAll('present')} style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}>All Present</button>
                  <button onClick={() => markAll('absent')} style={{ background: '#FEF2F2', color: RED, border: '1px solid #FEE2E2', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}>All Absent</button>
                </div>
              </div>

              {/* Student list */}
              <div style={{ ...card, padding: '8px', marginBottom: '20px' }}>
                {students.map(student => {
                  const isPresent = attendance[student._id] === 'present';
                  return (
                    <div
                      key={student._id}
                      onClick={() => toggleAttendance(student._id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '10px', marginBottom: '4px',
                        cursor: 'pointer', transition: 'all 150ms',
                        background: isPresent ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.06)',
                        border: `1.5px solid ${isPresent ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isPresent ? '#F0FDF4' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: isPresent ? '#16A34A' : RED, flexShrink: 0 }}>
                          {student.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9375rem' }}>{student.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Roll #{student.rollNo} · {student.section}</div>
                        </div>
                      </div>
                      <div style={{
                        padding: '5px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8125rem',
                        background: isPresent ? '#22C55E' : RED,
                        color: 'white', boxShadow: isPresent ? '0 2px 8px rgba(34,197,94,0.3)' : '0 2px 8px rgba(185,29,32,0.3)',
                        transition: 'all 150ms'
                      }}>
                        {isPresent ? 'Present' : 'Absent'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Note field */}
              <div style={{ ...card, padding: '20px', marginBottom: '20px' }}>
                <label style={labelStyle}>Session Note <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(Optional)</span></label>
                <textarea
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  value={sessionNote}
                  onChange={e => setSessionNote(e.target.value)}
                  placeholder="Any notes about today's class session..."
                />
              </div>

              {/* Submit */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedClassId}
                  style={{
                    background: selectedClassId ? RED : '#E5E7EB',
                    color: selectedClassId ? 'white' : '#9CA3AF',
                    border: 'none', borderRadius: '12px', padding: '14px 40px',
                    fontWeight: 800, fontSize: '1rem', cursor: selectedClassId ? 'pointer' : 'not-allowed',
                    boxShadow: selectedClassId ? '0 4px 16px rgba(185,29,32,0.3)' : 'none',
                    opacity: isSubmitting ? 0.7 : 1,
                    transition: 'all 200ms',
                    minWidth: '280px'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : `Submit Attendance (${presentCount}P / ${absentCount}A)`}
                </button>
                {!selectedClassId && (
                  <p style={{ marginTop: '8px', color: '#9CA3AF', fontSize: '0.8125rem' }}>Please select a class above before submitting</p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
