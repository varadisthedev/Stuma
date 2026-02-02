/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Alert Component
 * Displays status messages with different styles
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function Alert({ 
  type = 'info', 
  message, 
  title,
  onClose,
  style = {} 
}) {
  if (!message) return null;

  const alertClass = `alert alert-${type}`;

  return (
    <div className={alertClass} style={{ ...styles.alert, ...style }}>
      <div style={styles.content}>
        {title && <strong style={styles.title}>{title}</strong>}
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} style={styles.closeBtn}>
          ×
        </button>
      )}
    </div>
  );
}

const styles = {
  alert: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  title: {
    fontWeight: 600,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    opacity: 0.7,
  },
};
