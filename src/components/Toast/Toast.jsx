import { useEffect } from 'react'
import './Toast.css'

/**
 * Componente Toast: Notificaciones flotantes para mensajes de confirmación y error.
 * Guiado por trabajoPlan.pdf (Paso 12).
 */
export default function Toast({
  title,
  message,
  type = 'success', // 'success' | 'error' | 'warning' | 'info'
  onClose,
  duration = 4000
}) {
  const icons = {
    success: 'OK',
    error: 'Error',
    warning: 'Aviso',
    info: 'Info'
  }

  useEffect(() => {
    if (!duration || !onClose) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className={`novasalud-toast ${type}`} role="alert">
      <div className="toast-icon-box">{icons[type] || 'Info'}</div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <div className="toast-message">{message}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          className="toast-close-btn"
          onClick={onClose}
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      )}
    </div>
  )
}
