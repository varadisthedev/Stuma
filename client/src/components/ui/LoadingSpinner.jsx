/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Loading Spinner Component
 * Displays loading state with optional message
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function LoadingSpinner({ 
  size = 'md', 
  message = 'Loading...', 
  fullScreen = false 
}) {
  const sizeClass = size === 'sm' ? 'spinner-sm' : 'spinner';

  if (fullScreen) {
    return (
      <div className="loading-overlay">
        <div className={sizeClass}></div>
        {message && <p style={styles.message}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div className={sizeClass}></div>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem',
  },
  message: {
    color: '#4B5563',
    fontSize: '0.875rem',
  },
};
