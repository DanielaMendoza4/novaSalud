import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAlertas } from '../../hooks/useAlertas'
import './AlertBell.css'

/**
 * Componente AlertBell: Notificaciones de alertas críticas (stock bajo, vencimientos).
 * Guiado por trabajoPlan.pdf (Paso 10).
 */
export default function AlertBell({ alertas: propAlertas, onAlertClick }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const hookData = useAlertas()

  // Prioriza alertas pasadas por prop si se especifican, de lo contrario usa el hook useAlertas
  const alertList = propAlertas !== undefined ? propAlertas : (hookData?.alertas || [])
  const count = alertList.length

  // Cerrar al hacer clic fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="alert-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className={`alert-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Alertas (${count})`}
        aria-expanded={isOpen}
      >
        <svg className="alert-bell-icon" viewBox="0 0 24 24">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {count > 0 && (
          <span className="alert-bell-badge">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="alert-bell-dropdown" role="dialog" aria-label="Notificaciones">
          <div className="alert-dropdown-header">
            <div className="alert-dropdown-title-group">
              <h4 className="alert-dropdown-title">Alertas de Farmacia</h4>
              {count > 0 && (
                <span className="alert-dropdown-count">{count} activas</span>
              )}
            </div>
            <Link
              to="/avisos"
              className="alert-dropdown-link"
              onClick={() => setIsOpen(false)}
            >
              Ver todas
            </Link>
          </div>

          <ul className="alert-dropdown-list">
            {count === 0 ? (
              <li className="alert-dropdown-empty">
                <p>No hay alertas pendientes en este momento</p>
              </li>
            ) : (
              alertList.map((alerta) => (
                <li key={alerta.id || alerta._id}>
                  <Link
                    to="/avisos"
                    className="alert-dropdown-item"
                    onClick={() => {
                      setIsOpen(false)
                      if (onAlertClick) onAlertClick(alerta)
                    }}
                  >
                    <div className={`alert-item-indicator ${alerta.tipo || 'stock_bajo'}`}>
                      {alerta.icono || ''}
                    </div>
                    <div className="alert-item-content">
                      <div className="alert-item-title">{alerta.titulo || alerta.mensaje}</div>
                      <div className="alert-item-desc">{alerta.descripcion || `Producto: ${alerta.producto || 'Medicamento'}`}</div>
                      <div className="alert-item-time">{alerta.tiempo || 'Reciente'}</div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>

          <div className="alert-dropdown-footer">
            <Link
              to="/avisos"
              className="alert-view-all-btn"
              onClick={() => setIsOpen(false)}
            >
              Ir al panel de gestión de alertas →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
