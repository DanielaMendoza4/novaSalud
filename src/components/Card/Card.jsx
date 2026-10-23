import './Card.css'

/**
 * Componente Card: Tarjeta de indicadores/KPI para el Dashboard y Reportes.
 * Guiado por trabajoPlan.pdf (Paso 11).
 */
export default function Card({
  title,
  value,
  subtitle,
  icon = '📈',
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info'
  trend, // { direction: 'up' | 'down', text: '+12% vs ayer' }
  children,
  className = '',
  onClick
}) {
  return (
    <div
      className={`novasalud-card ${variant} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="card-top">
        <h3 className="card-title">{title}</h3>
        <div className="card-icon-wrapper">{icon}</div>
      </div>

      {value !== undefined && (
        <div className="card-value">{value}</div>
      )}

      {children}

      {(subtitle || trend) && (
        <div className="card-footer-info">
          {trend && (
            <span
              className={`card-trend ${
                trend.direction === 'up' ? 'positive' : 'negative'
              }`}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.text}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
