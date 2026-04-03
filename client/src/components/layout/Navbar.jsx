import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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

export default function Navbar() {
  const { user, teacher } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const currentUser = user || teacher;
  const filteredNavItems = currentUser?.role === 'volunteer' ? volunteerNavItems : adminNavItems;
  const profilePicUrl = currentUser?.profilePicUrl || null;
  const initials = (currentUser?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav style={styles.navbar}>
      <div style={styles.navLeft}>
        {/* Branding */}
        <Link to="/dashboard" style={styles.brandSection}>
          <img src={renovatioLogo} alt="Logo" style={styles.logoImage} />
        </Link>

        {/* Navigation Links */}
        <div style={styles.navLinks}>
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
      <div style={styles.navRight}>
        {/* Notifications */}
        <button style={styles.iconBtn} title="Notifications">
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#6B7280' }}>notifications</span>
        </button>

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
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '72px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navLeft: { display: 'flex', alignItems: 'center', height: '100%' },
  brandSection: { display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginRight: '48px' },
  logoImage: { height: '32px', width: 'auto', objectFit: 'contain' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '28px', height: '100%' },
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
  navRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
};
