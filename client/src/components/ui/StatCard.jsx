/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Stat Card Component
 * Displays a single statistic with icon and label
 * ═══════════════════════════════════════════════════════════════════════════
 */

export default function StatCard({ 
  icon, 
  value, 
  label, 
  color = 'primary',
  onClick,
}) {
  const colorStyles = {
    primary: { background: 'rgba(9, 65, 109, 0.1)', color: '#09416D' },
    success: { background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' },
    warning: { background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
    danger: { background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' },
    accent: { background: 'rgba(175, 121, 160, 0.1)', color: '#AF79A0' },
  };

  return (
    <div 
      className="glass-card stat-card"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div 
        className="stat-card-icon"
        style={colorStyles[color]}
      >
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
