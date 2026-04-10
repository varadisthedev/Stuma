import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import renovatioLogo from '../../assets/brandings/renovatioLogo.png';

const adminNavItems = [
  { path: '/dashboard', label: 'Overview',    icon: 'grid_view' },
  { path: '/classes',   label: 'Schedules',   icon: 'calendar_today' },
  { path: '/students',  label: 'Students',    icon: 'groups' },
  { path: '/volunteers',label: 'Volunteers',  icon: 'badge' },
  { path: '/attendance',label: 'Attendance',  icon: 'how_to_reg' },
  { path: '/analytics', label: 'Analytics',   icon: 'bar_chart' },
  { path: '/gallery',   label: 'Gallery',     icon: 'collections' },
];

const volunteerNavItems = [
  { path: '/dashboard',   label: 'Overview',     icon: 'grid_view' },
  { path: '/my-schedule', label: 'My Schedule',  icon: 'calendar_month' },
  { path: '/students',    label: 'Students',     icon: 'groups' },
  { path: '/analytics',   label: 'Analytics',    icon: 'bar_chart' },
  { path: '/gallery',     label: 'Gallery',      icon: 'collections' },
];

function AlertsDropdown({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const dropdownRef = useRef(null);
  const isAdmin = currentUser?.role === 'admin';

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/api/alerts');
      if (res.data.success) setAlerts(res.data.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAlerts();
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const sendAlert = async () => {
    if (!newMsg.trim()) return;
    setIsSending(true);
    try {
      const res = await api.post('/api/alerts', { message: newMsg });
      if (res.data.success) { setNewMsg(''); fetchAlerts(); }
    } catch (err) { console.error('Failed to send alert:', err); }
    setIsSending(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: '10px', color: '#6B7280', fontSize: '0.875rem', fontWeight: 600, transition: 'all 150ms' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#111827'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7280'; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px', position: 'relative' }}>
          {alerts.length > 0 ? 'notifications_active' : 'notifications'}
        </span>
        Notifications
        {alerts.length > 0 && (
          <span style={{ marginLeft: 'auto', background: '#e11d48', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '10px' }}>
            {alerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', bottom: '48px', left: '100%', marginLeft: '8px', width: '300px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', fontWeight: 600, fontSize: '0.875rem' }}>
            Alerts &amp; Notifications
          </div>
          <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '8px 0' }}>
            {alerts.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>No recent alerts</div>
            ) : (
              alerts.map(a => (
                <div key={a._id} style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>{a.senderName}</span>
                    <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#1F2937', lineHeight: 1.4 }}>{a.message}</div>
                </div>
              ))
            )}
          </div>
          {isAdmin && (
            <div style={{ padding: '12px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                autoComplete="off"
                placeholder="Send global alert..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAlert()}
                style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.8125rem', outline: 'none' }}
              />
              <button
                onClick={sendAlert}
                disabled={isSending || !newMsg.trim()}
                style={{ backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: isSending ? 0.7 : 1 }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { user, teacher } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentUser = user || teacher;
  const navItems = currentUser?.role === 'volunteer' ? volunteerNavItems : adminNavItems;
  const profilePicUrl = currentUser?.profilePicUrl || null;
  const initials = (currentUser?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #F3F4F6' }}>
        <Link to="/dashboard" onClick={() => setIsMobileOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src={renovatioLogo} alt="Renovatio" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        </Link>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 16px', borderRadius: '10px', textDecoration: 'none',
                fontSize: '0.875rem', fontWeight: 600, transition: 'all 150ms',
                color: isActive ? '#b91d20' : '#6B7280',
                background: isActive ? '#FEF2F2' : 'transparent',
                borderLeft: `3px solid ${isActive ? '#b91d20' : 'transparent'}`,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#111827'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Alerts + Profile */}
      <div style={{ padding: '12px', borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <AlertsDropdown currentUser={currentUser} />

        {/* Profile Button */}
        <button
          onClick={() => { navigate('/profile'); setIsMobileOpen(false); }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: '10px', textAlign: 'left', transition: 'background 150ms' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #b91d20', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#b91d20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentUser?.role}</div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#D1D5DB', flexShrink: 0 }}>chevron_right</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar - only shows on small screens */}
      <div className="md:hidden" style={{ position: 'sticky', top: 0, zIndex: 40, height: '60px', background: 'white', borderBottom: '1px solid #F3F4F6', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
        <button onClick={() => setIsMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#6B7280' }}>menu</span>
        </button>
        <img src={renovatioLogo} alt="Renovatio" style={{ height: '28px', objectFit: 'contain' }} />
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="Profile" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #b91d20' }} />
          ) : (
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#b91d20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'white' }}>{initials}</div>
          )}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex" style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px', background: 'white', borderRight: '1px solid #F3F4F6', flexDirection: 'column', zIndex: 50, boxShadow: '2px 0 12px rgba(0,0,0,0.04)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          <div onClick={() => setIsMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 }} />
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px', background: 'white', zIndex: 51, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 12px 0' }}>
              <button onClick={() => setIsMobileOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ color: '#6B7280' }}>close</span>
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
