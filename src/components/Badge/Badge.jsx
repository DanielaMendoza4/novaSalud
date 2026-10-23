import './Badge.css'

/**
 * Componente Badge: Insignia de estado para inventario (Stock bajo, Normal), alertas y roles.
 * Guiado por trabajoPlan.pdf (Paso 8, 10, 12).
 */
export default function Badge({
  children,
  variant = 'neutral', // 'success' | 'danger' | 'warning' | 'primary' | 'info' | 'neutral'
  size = 'md', // 'sm' | 'md' | 'lg'
  dot = false,
  icon,
  className = ''
}) {
  return (
    <span className={`novasalud-badge ${variant} ${size} ${className}`}>
      {dot && <span className="badge-dot" />}
      {icon && <span className="badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  )
}
