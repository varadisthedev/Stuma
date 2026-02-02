/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Empty State Component
 * Displays when there's no data to show
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function EmptyState({ 
  icon = '◌', 
  title = 'No data found', 
  message = '',
  action,
  actionLabel = 'Add New',
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-text">{message}</p>}
      {action && (
        <button className="btn btn-primary" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
