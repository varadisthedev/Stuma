/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Navbar Component - Ramdeobaba University
 * Main navigation bar with university branding, dark mode toggle, and user info
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import universityLogo from '../../assets/logo.jpg';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '◉' },
  { path: '/classes', label: 'Classes', icon: '◫' },
  { path: '/students', label: 'Students', icon: '◎' },
  { path: '/attendance', label: 'Attendance', icon: '◧' },
  { path: '/analytics', label: 'Analytics', icon: '◈' },
];

export default function Navbar() {
  const { teacher, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const handleLogout = () => {
    console.log('[NAVBAR] User clicked logout');
    logout();
  };

  return (
    <nav style={styles.navbar}>
      {/* University Branding */}
      <Link to="/dashboard" style={styles.brandSection}>
        <div style={styles.logoWrapper}>
          <img 
            src={universityLogo} 
            alt="Ramdeobaba University" 
            style={styles.logoImage}
          />
        </div>
        <div style={styles.brandText}>
          <span style={styles.brandName}>Ramdeobaba University</span>
          <span style={styles.brandTagline}>Attendance Portal</span>
        </div>
      </Link>

      {/* Navigation Links */}
      <div style={styles.navLinks}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.navLink,
              ...(location.pathname === item.path && styles.navLinkActive),
            }}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </div>

      {/* User Section with Dark Mode Toggle */}
      <div style={styles.userSection}>
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {teacher?.name?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>{teacher?.name || 'Teacher'}</span>
            <span style={styles.userRole}>Faculty</span>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <span style={styles.logoutIcon}>⏻</span>
          <span>Logout</span>
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
    padding: '0.75rem 1.5rem',
    margin: '1rem',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(9, 65, 109, 0.95) 0%, rgba(10, 90, 148, 0.92) 50%, rgba(9, 65, 109, 0.95) 100%)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(9, 65, 109, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  brandSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  logoWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'white',
    padding: '3px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    flexShrink: 0,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '7px',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  brandName: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'white',
    letterSpacing: '0.01em',
    lineHeight: 1.2,
  },
  brandTagline: {
    fontSize: '0.6875rem',
    fontWeight: 500,
    color: 'rgba(187, 187, 227, 0.9)',
    letterSpacing: '0.02em',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(0, 0, 0, 0.15)',
    padding: '4px',
    borderRadius: '12px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.8125rem',
    fontWeight: 500,
    transition: 'all 200ms ease',
  },
  navLinkActive: {
    background: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  navIcon: {
    fontSize: '0.875rem',
    opacity: 0.9,
  },
  navLabel: {},
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'white',
    lineHeight: 1.2,
  },
  userRole: {
    fontSize: '0.6875rem',
    color: 'rgba(187, 187, 227, 0.8)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  logoutIcon: {
    fontSize: '0.875rem',
  },
};
