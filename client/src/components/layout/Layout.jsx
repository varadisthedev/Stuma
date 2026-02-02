/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Layout Wrapper Component
 * Provides consistent layout with Navbar for authenticated pages
 * With blurred background image
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import homepageBg from '../../assets/homepage/image.png';

export default function Layout() {
  return (
    <div style={styles.layoutWrapper}>
      {/* Blurred Background Layer */}
      <div style={styles.bgLayer}>
        <div style={{
          ...styles.bgImage,
          backgroundImage: `url(${homepageBg})`,
        }} />
        <div style={styles.bgOverlay} />
      </div>

      {/* Content Layer */}
      <div style={styles.contentLayer}>
        <Navbar />
        <main className="main-content" style={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  layoutWrapper: {
    position: 'relative',
    minHeight: '100vh',
    overflow: 'hidden',
  },

  // Background Layer - Fixed, blurred
  bgLayer: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
  },
  bgImage: {
    position: 'absolute',
    inset: '-10px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    filter: 'blur(3px)',
    transform: 'scale(1.02)',
  },
  bgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(248, 250, 252, 0.35) 50%, rgba(255, 255, 255, 0.3) 100%)',
  },

  // Content Layer - Above background
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
