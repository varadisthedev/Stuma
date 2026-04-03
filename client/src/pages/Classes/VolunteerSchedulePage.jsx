import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatTime, groupBy } from '../../utils/helpers';
import { getHoliday, isCurrentSlot } from '../../utils/timetableUtils';
import { GridPageSkeleton } from '../../components/ui/Skeleton';

export default function VolunteerSchedulePage() {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  const myId = currentUser?._id || currentUser?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [myClasses, setMyClasses] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await classesAPI.getAll();
        const all = res.classes || [];
        const mine = all.filter(c =>
          c.assignedVolunteer &&
          (c.assignedVolunteer._id === myId || c.assignedVolunteer === myId)
        );
        setMyClasses(mine);
      } catch (err) {
        console.error('[VOL SCHEDULE] Failed:', err);
      }
      setIsLoading(false);
    };
    load();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentWeekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentTime);
    const currentDay = d.getDay() || 7;
    d.setDate(d.getDate() - currentDay + 1 + (weekOffset * 7) + i);
    return d.toISOString().split('T')[0];
  });

  const classesByDate = groupBy(myClasses, 'date');
  const year = currentTime.getFullYear();
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const day = String(currentTime.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const weekLabel = () => {
    const start = currentWeekDates[0];
    const end = currentWeekDates[6];
    const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  };

  if (isLoading) return <GridPageSkeleton />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '8px', letterSpacing: '-0.02em' }}>My Schedule</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '2px', backgroundColor: '#b91d20' }}></div>
            <p style={{ color: '#b91d20', fontWeight: 700, margin: 0 }}>
              Live: {currentTime.toLocaleString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', flexShrink: 0 }}>
          <button onClick={() => setWeekOffset(p => p - 1)} style={{ padding: '10px 18px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.875rem', color: '#6B7280', cursor: 'pointer' }}>← Prev</button>
          <button onClick={() => setWeekOffset(0)} style={{ padding: '10px 18px', border: 'none', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB', background: weekOffset === 0 ? '#FEF2F2' : 'none', fontWeight: 700, fontSize: '0.875rem', color: weekOffset === 0 ? '#b91d20' : '#111827', cursor: 'pointer' }}>This Week</button>
          <button onClick={() => setWeekOffset(p => p + 1)} style={{ padding: '10px 18px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.875rem', color: '#6B7280', cursor: 'pointer' }}>Next →</button>
        </div>
      </div>

      {myClasses.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '20px', padding: '64px 32px', border: '1px solid #EBEBEB', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '72px', height: '72px', background: '#FEF2F2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#b91d20' }}>event_busy</span>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: '12px' }}>No classes assigned yet</h2>
          <p style={{ color: '#6B7280', maxWidth: '360px', margin: '0 auto', lineHeight: 1.6 }}>
            You have no scheduled classes. Contact your admin for new assignments.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px', marginBottom: '32px' }}>
          {currentWeekDates.map(dateStr => {
            const dateObj = new Date(dateStr + 'T00:00:00');
            const displayDay = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dayClasses = classesByDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const holiday = getHoliday(dateStr);

            return (
              <div key={dateStr} style={{ background: 'white', border: isToday ? '2px solid #b91d20' : '1px solid #EBEBEB', borderRadius: '14px', display: 'flex', flexDirection: 'column', minHeight: '180px', boxShadow: isToday ? '0 4px 16px rgba(185,29,32,0.1)' : '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
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
                    {dayClasses.length > 0 && (
                      <span style={{ background: isToday ? '#FEE2E2' : '#F3F4F6', padding: '1px 6px', borderRadius: '10px' }}>{dayClasses.length}</span>
                    )}
                  </div>
                </div>

                {/* Classes */}
                <div style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dayClasses.length > 0 ? (
                    dayClasses
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(cls => {
                        const active = isCurrentSlot(dateStr, cls.startTime, cls.endTime, currentTime);
                        return (
                          <div key={cls._id} style={{ background: active ? '#FFF5F5' : '#FCFDFD', border: active ? '1.5px solid #b91d20' : '1px solid #F0F0F0', borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '3px', position: 'relative' }}>
                            {active && (
                              <div style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', background: '#b91d20', boxShadow: '0 0 0 2px rgba(185,29,32,0.25)' }} />
                            )}
                            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: active ? '#b91d20' : '#9CA3AF' }}>
                              {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                            </div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cls.subject}
                            </div>
                            {cls.youtubeLink && (
                              <a href={cls.youtubeLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.625rem', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>smart_display</span>
                                View Content
                              </a>
                            )}
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                              <Link to={`/attendance?classId=${cls._id}`} style={{ flex: 1, background: '#FEF2F2', color: '#b91d20', border: '1px solid #FEE2E2', borderRadius: '5px', padding: '4px 6px', fontSize: '0.5625rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none', display: 'block' }}>Attendance</Link>
                              <Link to={`/analytics?classId=${cls._id}`} style={{ flex: 1, background: '#F9FAFB', color: '#6B7280', border: '1px solid #F3F4F6', borderRadius: '5px', padding: '4px 6px', fontSize: '0.5625rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none', display: 'block' }}>Analytics</Link>
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
      )}
    </div>
  );
}
