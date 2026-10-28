import { useState } from 'react'
import AlertBell from '../AlertBell/AlertBell'
import './Navbar.css'

/**
 * Componente Navbar: Barra superior de la aplicación Botica Nova Salud.
 * Guiado por trabajoPlan.pdf (Paso 4, 7, 10).
 */
export default function Navbar({
  onToggleCollapse,
  isSidebarCollapsed = false,
  user = { nombre: 'Daniel Mendoza', rol: 'admin', sucursal: 'Botica Central' },
  onLogout,
  alertas
}) {
  const [busqueda, setBusqueda] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (busqueda.trim()) {
      // Búsqueda rápida o acción de lector de código de barras
      console.log('Buscando producto o código:', busqueda)
    }
  }

  const roleLabels = {
    admin: 'Administrador',
    vendedor: 'Vendedor (POS)',
    almacen: 'Encargado Almacén'
  }

  const initials = user?.nombre
    ? user.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'NS'

  return (
    <header className="novasalud-navbar">
      {/* Control del menú lateral */}
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-collapse-btn"
          onClick={onToggleCollapse}
          title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
        >
          <span aria-hidden="true">{isSidebarCollapsed ? '→' : '←'}</span>
        </button>

        <div className="navbar-branch-pill">
          <span className="navbar-branch-dot"></span>
          <span>{user?.sucursal || 'Sede Central'}</span>
        </div>
      </div>

      {/* Sección Central: Búsqueda rápida de productos / lector de código de barras */}
      <div className="navbar-center">
        <form onSubmit={handleSearchSubmit} className="navbar-search-wrapper">
          <svg className="navbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Buscar medicamento o código de barras... (Enter)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <kbd className="navbar-search-kbd">POS</kbd>
        </form>
      </div>

      {/* Sección Derecha: Notificaciones, Usuario, Salir */}
      <div className="navbar-right">
        <AlertBell alertas={alertas} />

        <div className="navbar-user-chip" title={`Usuario: ${user?.nombre || 'Usuario'}`}>
          <div className="navbar-user-avatar">
            {initials}
          </div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.nombre || 'Personal Botica'}</span>
            <span className="navbar-user-role">{roleLabels[user?.rol] || user?.rol || 'Personal'}</span>
          </div>
        </div>

        <button
          type="button"
          className="navbar-logout-btn"
          onClick={onLogout || (() => console.log('Cerrar sesión'))}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <svg className="navbar-logout-icon" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  )
}
