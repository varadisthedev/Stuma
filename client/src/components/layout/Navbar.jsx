import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api'; // authenticated instance
import { useAuth } from '../../context/AuthContext';
import renovatioLogo from '../../assets/brandings/renovatioLogo.png';

const adminNavItems = [
  { path: '/dashboard', label: 'DASHBOARD' },
  { path: '/classes', label: 'CLASSES' },
  { path: '/students', label: 'STUDENTS' },
  { path: '/volunteers', label: 'VOLUNTEERS' },
  { path: '/attendance', label: 'ATTENDANCE' },
  { path: '/analytics', label: 'ANALYTICS' },
  { path: '/gallery', label: 'GALLERY' },
];

const volunteerNavItems = [
  { path: '/dashboard', label: 'DASHBOARD' },
  { path: '/my-schedule', label: 'MY SCHEDULE' },
  { path: '/students', label: 'STUDENTS' },
  { path: '/analytics', label: 'ANALYTICS' },
  { path: '/gallery', label: 'GALLERY' },
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
    
    // Close on outside click
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
      if (res.data.success) {
        setNewMsg('');
        fetchAlerts(); 
      }
    } catch (err) {
      console.error('Failed to send target:', err);
    }
    setIsSending(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button style={styles.iconBtn} title="Notifications" onClick={() => setIsOpen(!isOpen)}>
        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#6B7280' }}>
          {alerts.length > 0 ? 'notifications_active' : 'notifications'}
        </span>
        {alerts.length > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', backgroundColor: '#e11d48', borderRadius: '50%' }} />
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '48px', right: '0', width: '320px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', fontWeight: 600, fontSize: '0.875rem' }}>
            Alerts & Notifications
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
                placeholder="Send global alert..." 
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAlert()}
                style={{ flex: 1, padding: '6px 12px', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '0.8125rem', outline: 'none' }}
              />
              <button 
                onClick={sendAlert}
                disabled={isSending || !newMsg.trim()}
                style={{ backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '4px', padding: '0 12px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', opacity: isSending ? 0.7 : 1 }}
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

export default function Navbar() {
  const { user, teacher } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = user || teacher;
  const filteredNavItems = currentUser?.role === 'volunteer' ? volunteerNavItems : adminNavItems;
  const profilePicUrl = currentUser?.profilePicUrl || null;
  const initials = (currentUser?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-4 md:px-8 h-[72px] bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center h-full">
        {/* Branding */}
        <div className="flex items-center gap-4 mr-4 md:mr-12">
          <button 
            className="md:hidden flex items-center justify-center p-2 rounded hover:bg-gray-100" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-gray-600">menu</span>
          </button>
          <Link to="/dashboard" className="flex items-center gap-3 no-underline">
            <img src={renovatioLogo} alt="Logo" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7 h-full">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Notifications Dropdown */}
        <AlertsDropdown currentUser={currentUser} />

        {/* Profile avatar */}
        <button
          style={{ ...styles.iconBtn, padding: 0 }}
          onClick={() => navigate('/profile')}
          title="My Profile"
        >
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt="Profile"
              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #b91d20' }}
            />
          ) : (
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#b91d20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 800, color: 'white' }}>
              {initials}
            </div>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-white border-b border-gray-200 shadow-lg md:hidden flex flex-col py-2 px-4 shadow-xl z-40">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-3 px-4 rounded-lg font-bold text-sm tracking-wide ${isActive ? 'bg-red-50 text-[#b91d20]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

const styles = {
  navLink: {
    textDecoration: 'none',
    color: '#6B7280',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '3px solid transparent',
    paddingTop: '3px',
    transition: 'all 200ms',
  },
  navLinkActive: { color: '#b91d20', borderBottomColor: '#b91d20' },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
};
