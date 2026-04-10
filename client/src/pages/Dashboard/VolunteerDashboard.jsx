import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { classesAPI, studentsAPI } from '../../services/api';
import { formatTime } from '../../utils/helpers';
import { DashboardSkeleton } from '../../components/ui/Skeleton';

export default function VolunteerDashboard() {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;

  const [isLoading, setIsLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [nowTS, setNowTS] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNowTS(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const myId = currentUser?._id || currentUser?.id;
        const [todayRes, allRes, studentsRes] = await Promise.all([
          classesAPI.getToday(),
          classesAPI.getAll(),
          studentsAPI.getAll(),
        ]);

        const today = todayRes.classes || [];
        const all = allRes.classes || [];

        const mine = all.filter(c =>
          c.assignedVolunteer &&
          (c.assignedVolunteer._id === myId || c.assignedVolunteer === myId)
        );
        const myToday = today.filter(c =>
          c.assignedVolunteer &&
          (c.assignedVolunteer._id === myId || c.assignedVolunteer === myId)
        );

        setTodayClasses(myToday);
        setMyClasses(mine);
        setStudentCount(studentsRes.count || 0);
      } catch (err) {
        console.error('[VOL DASHBOARD] Failed:', err);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) return <DashboardSkeleton />;

  const card = { background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)' };

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const upcoming = myClasses
    .filter(c => {
      if (c.date > todayStr) return true;
      if (c.date === todayStr) {
        const [eh, em] = (c.endTime || '23:59').split(':').map(Number);
        return (eh * 60 + em) > currentMinutes;
      }
      return false;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
  const past = myClasses.filter(c => c.date < todayStr || (c.date === todayStr && (() => { const [eh, em] = (c.endTime || '00:00').split(':').map(Number); return (eh * 60 + em) <= currentMinutes; })()));

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 120px)' }}>

      {/* MAIN */}
      <main style={{ paddingTop: '8px', paddingBottom: '40px' }}>
        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Volunteer Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '2px', background: '#b91d20' }}></div>
            <span style={{ color: '#6B7280', fontWeight: 500, fontSize: '1rem' }}>
              Welcome back, {currentUser?.name?.split(' ')[0] || 'Volunteer'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

          {/* Left stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ ...card, padding: '24px' }}>
              <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#b91d20', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>My Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'My Total Classes', value: myClasses.length, icon: 'book' },
                  { label: 'Upcoming Classes', value: upcoming.length, icon: 'event' },
                  { label: 'Classes Completed', value: past.length, icon: 'check_circle' },
                  { label: 'Active Students', value: studentCount, icon: 'school' },
                ].map((s, i, arr) => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
                      <div>
                        <div style={{ fontSize: '0.8125rem', color: '#6B7280', fontWeight: 500, marginBottom: '3px' }}>{s.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{s.value}</div>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#b91d20' }}>{s.icon}</span>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: '1px', background: '#F3F4F6' }}></div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick link to schedule */}
            <Link to="/my-schedule" style={{ ...card, padding: '18px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'transform 150ms' }}>
              <div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#b91d20', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>My Timetable</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>View Full Schedule</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#b91d20' }}>arrow_forward</span>
            </Link>
          </div>

          {/* Right: Schedule preview */}
          <div style={{ ...card, padding: '32px' }}>
            {todayClasses.length === 0 && upcoming.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ width: '72px', height: '72px', background: '#FEF2F2', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#b91d20' }}>event_busy</span>
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: '12px' }}>No classes assigned</h2>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '320px' }}>
                  You have no scheduled classes at the moment. Check with your admin for new assignments.
                </p>
              </div>
            ) : (
              <div>
                {todayClasses.length > 0 && (
                  <div style={{ marginBottom: upcoming.length > 0 ? '28px' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F3F4F6' }}>
                      <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>Today's Classes</h2>
                      <span style={{ background: '#FEF2F2', color: '#b91d20', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>{todayClasses.length} class{todayClasses.length > 1 ? 'es' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {todayClasses.map(cls => (
                        <div key={cls._id} style={{ background: '#FFF5F5', border: '1px solid #FEE2E2', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>{formatTime(cls.startTime)} – {formatTime(cls.endTime)}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{cls.subject}</div>
                          </div>
                          <Link to={`/attendance?classId=${cls._id}`} style={{ flexShrink: 0, background: '#b91d20', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.8125rem', padding: '8px 16px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                            Take Attendance
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {upcoming.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F3F4F6' }}>
                      <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>Upcoming Classes</h2>
                      <Link to="/my-schedule" style={{ color: '#b91d20', fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none' }}>Full schedule →</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {upcoming.slice(0, 5).map(cls => (
                        <div key={cls._id} style={{ background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '2px' }}>{cls.date} · {formatTime(cls.startTime)} – {formatTime(cls.endTime)}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{cls.subject}</div>
                          </div>
                          <span style={{ flexShrink: 0, background: '#F3F4F6', color: '#374151', fontSize: '0.6875rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>Scheduled</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>🏢</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Renovatio Foundation © 2024</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Privacy Policy', 'Volunteer Guidelines', 'System Status'].map(label => (
              <a key={label} href="#" style={{ fontSize: '0.75rem', color: '#9CA3AF', textDecoration: 'none', fontWeight: 500 }}>{label}</a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
