import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
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
      <div style={styles.contentLayer}>
        <Navbar />
        <main className="main-content" style={styles.mainContent}>
          <div key={location.pathname} className="animate-fade-in" style={{ width: '100%', height: '100%' }}>
            <Outlet />
          </div>
        </main>
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
};
