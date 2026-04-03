import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { VolunteerChatWidget } from '../chat/ChatComponents';
import { VolunteerCaptureWidget } from '../capture/VolunteerCaptureWidget';

export default function Layout() {
  const { user, teacher } = useAuth();
  const currentUser = user || teacher;
  const isVolunteer = currentUser?.role === 'volunteer';

  return (
    <div style={styles.layoutWrapper}>
      <div style={styles.contentLayer}>
        <Navbar />
        <main className="main-content" style={styles.mainContent}>
          <Outlet />
        </main>
      </div>
      {/* Floating chat widget for volunteers */}
      {isVolunteer && <VolunteerChatWidget />}
      {/* Floating camera capture widget for volunteers */}
      {isVolunteer && <VolunteerCaptureWidget />}
    </div>
  );
}

const styles = {
  layoutWrapper: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
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
    padding: '24px 32px',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
  },
};
