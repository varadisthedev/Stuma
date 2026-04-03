import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { classesAPI, studentsAPI } from '../../services/api';
import { formatTime } from '../../utils/helpers';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import VolunteerDashboard from './VolunteerDashboard';

// Decorative brand-themed full-page background
function DashboardBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Full-screen subtle dot pattern */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          opacity: 1,
          backgroundImage: 'radial-gradient(rgba(185, 29, 32, 0.4) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at 50% 10%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 10%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 100%)'
        }} 
      />
      
      {/* Large soft glows for brand color */}
      <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,29,32,0.06) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,29,32,0.05) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', top: '40%', right: '25%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(185,29,32,0.03) 0%, transparent 50%)' }} />

      {/* Decorative vertical accent lines */}
      <div style={{ position: 'absolute', top: 0, right: '8%', width: '1px', height: '100%', background: 'linear-gradient(to bottom, rgba(185,29,32,0.15), rgba(185,29,32,0))' }} />
      <div style={{ position: 'absolute', top: 0, right: '12%', width: '1px', height: '70%', background: 'linear-gradient(to bottom, transparent, rgba(185,29,32,0.1), transparent)' }} />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { teacher, user } = useAuth();
  const currentUser = user || teacher;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayClasses, setTodayClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [todayRes, allClassesRes, studentsRes] = await Promise.all([
        classesAPI.getToday(),
        classesAPI.getAll(),
        studentsAPI.getAll(),
      ]);
      setTodayClasses(todayRes.classes || []);
      setAllClasses(allClassesRes.classes || []);
      setStudentCount(studentsRes.count || 0);
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    }
    setIsLoading(false);
  };

  if (isLoading) return <DashboardSkeleton />;

  if (currentUser?.role === 'volunteer') {
    return <VolunteerDashboard allClasses={allClasses} />;
  }

  const card = { background: 'white', borderRadius: '16px', border: '1px solid #EBEBEB', boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)' };

  const sidebarLink = (to, icon, label, active = false) => (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 16px', borderRadius: '10px', textDecoration: 'none',
      fontSize: '0.875rem', fontWeight: 600, transition: 'all 150ms',
      color: active ? '#b91d20' : '#6B7280',
      background: active ? '#FEF2F2' : 'transparent',
      borderLeft: `3px solid ${active ? '#b91d20' : 'transparent'}`,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
      {label}
    </Link>
  );

  return (
    <div style={{ position: 'relative', display: 'flex', gap: '32px', minHeight: 'calc(100vh - 120px)' }}>
      <DashboardBg />

      {/* LEFT SIDEBAR */}
      <aside style={{ position: 'relative', zIndex: 1, width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', paddingTop: '8px' }}>
        {/* User Card */}
        <div style={{ ...card, padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#b91d20' }}>admin_panel_settings</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.name || 'Administrator'}
            </div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Admin Portal
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {sidebarLink('/dashboard', 'grid_view', 'Overview', true)}
          {sidebarLink('/classes', 'calendar_today', 'Schedules')}
          {sidebarLink('/students', 'people', 'Students')}
          {sidebarLink('/volunteers', 'badge', 'Volunteers')}
          {sidebarLink('/analytics', 'bar_chart', 'Analytics')}
        </nav>

        {/* Bottom actions */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
          <Link to="/classes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#b91d20', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', padding: '11px 16px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(185,29,32,0.2)' }}>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span> New Schedule
          </Link>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 500, padding: '6px 16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>help</span> Help Center
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, paddingTop: '8px', paddingBottom: '40px' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Admin Resource Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '2px', background: '#b91d20' }}></div>
            <span style={{ color: '#6B7280', fontWeight: 500, fontSize: '1rem' }}>Foundation scheduling &amp; metrics overview</span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#b91d20', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Stats + Schedule Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

          {/* Left: Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stats Card */}
            <div style={{ ...card, padding: '24px' }}>
              <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#b91d20', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px' }}>Quick Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 500, marginBottom: '4px' }}>Students Enrolled</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{studentCount}</div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#b91d20' }}>school</span>
                </div>
                <div style={{ height: '1px', background: '#E5E7EB' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 500, marginBottom: '4px' }}>Total Classes</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{allClasses.length}</div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#b91d20' }}>book</span>
                </div>
                <div style={{ height: '1px', background: '#E5E7EB' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 500, marginBottom: '4px' }}>Today's Classes</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{todayClasses.length}</div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#b91d20' }}>today</span>
                </div>
              </div>
            </div>

            {/* Alert Card */}
            <div style={{ ...card, padding: '20px' }}>
              <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#b91d20', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Foundation Alert</h3>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6, fontWeight: 500 }}>
                Administrative metrics show high attendance trends this week. Ensure all session reporting is completed accurately.
              </p>
            </div>

            {/* Quick links */}
            <div style={{ ...card, padding: '20px' }}>
              <h3 style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Quick Access</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { to: '/students', icon: 'people', label: 'Manage Students' },
                  { to: '/volunteers', icon: 'badge', label: 'View Volunteers' },
                  { to: '/analytics', icon: 'bar_chart', label: 'Analytics' },
                ].map(item => (
                  <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: '#F9FAFB', textDecoration: 'none', color: '#374151', fontSize: '0.8125rem', fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#9CA3AF' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Today's Classes */}
          <div style={{ ...card, padding: '32px' }}>
            {todayClasses.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px' }}>
                <div style={{ width: '72px', height: '72px', background: '#FEF2F2', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#b91d20' }}>event_busy</span>
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: '12px' }}>No classes today</h2>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '320px', marginBottom: '28px' }}>
                  There are no active classes scheduled for today across the foundation.
                </p>
                <Link to="/classes" style={{ background: '#b91d20', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.875rem', padding: '12px 28px', borderRadius: '10px', display: 'inline-block' }}>
                  View Schedule
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>Today's Live Classes</h2>
                  <Link to="/classes" style={{ color: '#b91d20', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none' }}>View Calendar →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {todayClasses.slice(0, 5).map(cls => (
                    <div key={cls._id} style={{ background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: '14px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '4px' }}>
                          {cls.date && `${cls.date} | `}{formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cls.subject}
                        </div>
                        {cls.assignedVolunteer && (
                          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>person</span>
                            {typeof cls.assignedVolunteer === 'object' ? cls.assignedVolunteer.name : cls.assignedVolunteer}
                          </div>
                        )}
                      </div>
                      <Link to={`/attendance?classId=${cls._id}`} style={{ flexShrink: 0, background: '#FEF2F2', color: '#b91d20', border: '1px solid #FEE2E2', textDecoration: 'none', fontWeight: 700, fontSize: '0.8125rem', padding: '8px 18px', borderRadius: '8px', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        Attendance
                      </Link>
                    </div>
                  ))}
                </div>
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
            {['Privacy Policy', 'System Analytics', 'Admin Tools'].map(label => (
              <a key={label} href="#" style={{ fontSize: '0.75rem', color: '#9CA3AF', textDecoration: 'none', fontWeight: 500 }}>{label}</a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
