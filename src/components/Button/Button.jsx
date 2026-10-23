import './Button.css'

/**
 * Componente Button: Botón estilizado reutilizable para la botica Nova Salud.
 * Guiado por trabajoPlan.pdf (Paso 9, 11).
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'success' | 'danger' | 'outline' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`novasalud-btn ${variant} ${size} ${fullWidth ? 'full-width' : ''} ${
        loading ? 'loading' : ''
      } ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner" />
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}
