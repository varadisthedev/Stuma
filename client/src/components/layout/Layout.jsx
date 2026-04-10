import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { VolunteerChatWidget } from '../chat/ChatComponents';
import { VolunteerCaptureWidget } from '../capture/VolunteerCaptureWidget';

// Global page background — subtle grid + brand accents
// Renders behind all pages, full viewport
function PageBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* Fine grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: [
          'linear-gradient(rgba(185,29,32,0.055) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(185,29,32,0.055) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '40px 40px',
      }} />
      {/* Soft brand glow — top right */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '55vw',
        height: '55vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(185,29,32,0.055) 0%, transparent 65%)',
      }} />
      {/* Soft brand glow — bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '45vw',
        height: '45vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(185,29,32,0.04) 0%, transparent 65%)',
      }} />
      {/* Thin vertical accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: '6%',
        width: '1px',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(185,29,32,0.12), transparent 70%)',
      }} />
    </div>
  );
}

export default function Layout() {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  const isVolunteer = currentUser?.role === 'volunteer';

  const location = useLocation();

  return (
    <div style={styles.layoutWrapper}>
      <PageBackground />
      <Sidebar />
      <div className="md:ml-[240px]" style={styles.contentLayer}>
        <main className="main-content" style={styles.mainContent}>
          <div key={location.pathname} className="animate-fade-in" style={{ width: '100%', height: '100%' }}>
            <Outlet />
          </div>
        </main>
        
        {/* Credits Footer */}
        <footer style={styles.footer}>
          <a
            onMouseEnter={e => e.currentTarget.style.color = '#111827'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
          href="https://github.com/varadisthedev/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.creditsLink}
          >
            <span>Developed by varadisthedev</span>
            <svg height="14" viewBox="0 0 16 16" width="14" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
          </a>
        </footer>
      </div>
      {isVolunteer && <VolunteerChatWidget />}
      {isVolunteer && <VolunteerCaptureWidget />}
    </div>
  );
}

const styles = {
  layoutWrapper: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: '"Inter", sans-serif',
  },
  contentLayer: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  mainContent: {
    flex: 1,
    padding: 'min(5vw, 24px) min(4vw, 32px)',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  footer: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: 'white',
    marginTop: 'auto',
  },
  creditsLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
    color: '#6B7280',
    fontSize: '0.75rem',
    fontWeight: 600,
    transition: 'color 150ms ease',
  }
};

