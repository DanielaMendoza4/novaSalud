import { useEffect } from 'react'
import './Modal.css'

/**
 * Componente Modal: Diálogo modal reutilizable para cobro POS, nuevo producto, reposición.
 * Guiado por trabajoPlan.pdf (Paso 9, 11).
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  children,
  footer
}) {
  // Manejo de la tecla Escape para cerrar
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="novasalud-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`novasalud-modal-window ${size}`}>
        <div className="modal-header">
          <div className="modal-title-group">
            {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
            <h3 className="modal-title">{title}</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
