import { useEffect, useRef } from 'react'
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
  const modalRef = useRef(null)

  // Manejo de la tecla Escape para cerrar
  useEffect(() => {
    if (!isOpen) return undefined

    const elementoAnterior = document.activeElement
    const contenido = modalRef.current
    const focoInicial =
      contenido?.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])') ||
      contenido?.querySelector('button:not([disabled])')
    focoInicial?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape' && onClose) {
        onClose()
        return
      }

      if (e.key === 'Tab' && contenido) {
        const elementos = [...contenido.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        if (!elementos.length) return
        const primero = elementos[0]
        const ultimo = elementos[elementos.length - 1]
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primero.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflowAnterior
      if (elementoAnterior instanceof HTMLElement) elementoAnterior.focus()
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
      aria-labelledby="novasalud-modal-title"
    >
      <div ref={modalRef} className={`novasalud-modal-window ${size}`}>
        <div className="modal-header">
          <div className="modal-title-group">
            {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
            <h3 id="novasalud-modal-title" className="modal-title">{title}</h3>
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
