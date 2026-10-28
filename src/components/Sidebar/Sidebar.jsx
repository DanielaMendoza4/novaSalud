import { NavLink } from 'react-router-dom'
import logoFarmacia from '../../assets/images/logo-farmacia.jpg'
import './Sidebar.css'

/**
 * Componente Sidebar: Menú lateral de navegación con módulos de Nova Salud.
 * Guiado por trabajoPlan.pdf (Paso 4, 7, 9, 11).
 */
export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
  userRole = 'admin',
  alertCount = 3
}) {
  const menuItems = [
    {
      to: '/',
      label: 'Dashboard',
      roles: ['admin', 'vendedor', 'almacen']
    },
    {
      to: '/ventas',
      label: 'Ventas (POS)',
      badge: 'F2',
      badgeClass: 'pill',
      roles: ['admin', 'vendedor']
    },
    {
      to: '/inventario',
      label: 'Inventario',
      badge: 'Stock',
      badgeClass: 'role',
      roles: ['admin', 'almacen']
    },
    {
      to: '/clientes',
      label: 'Clientes',
      roles: ['admin', 'vendedor']
    },
    {
      to: '/alertas',
      label: 'Alertas',
      badge: alertCount > 0 ? alertCount : null,
      badgeClass: 'danger',
      roles: ['admin', 'vendedor', 'almacen']
    },
    {
      to: '/reportes',
      label: 'Reportes',
      badge: 'Admin',
      badgeClass: 'role',
      roles: ['admin']
    }
  ]

  // Filtramos o marcamos según el rol de la sesión
  const filteredItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <>
      {/* Fondo oscuro para móvil */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`novasalud-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Encabezado del Sidebar */}
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand" onClick={onClose}>
            {!isCollapsed && (
              <img
                className="sidebar-logo-image"
                src={logoFarmacia}
                alt="Logo de Nova Salud Botica"
              />
            )}
          </NavLink>

          <button
            type="button"
            className="sidebar-close-mobile-btn"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            Cerrar
          </button>
        </div>

        {/* Lista de navegación */}
        <nav className="sidebar-nav">
          {!isCollapsed && <span className="sidebar-nav-label">Módulos Principales</span>}

          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon && <span className="sidebar-icon">{item.icon}</span>}
              {!isCollapsed && (
                <>
                  <span className="sidebar-link-text">{item.label}</span>
                  {item.badge && (
                    <span className={`sidebar-badge ${item.badgeClass || ''}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Pie del Sidebar */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="sidebar-system-info">
              <div className="sidebar-status-indicator">
                <span className="sidebar-status-dot"></span>
                <span>Servidor en línea</span>
              </div>
              <span>v1.0.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
