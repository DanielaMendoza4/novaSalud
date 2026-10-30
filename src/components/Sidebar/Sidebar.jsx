import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context'
import logo from '../../assets/LOGO.jpeg'
import './Sidebar.css'

const ICONS = {
  dashboard: (<><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></>),
  ventas: (<><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h3l3 12h11l2-8H6" /></>),
  inventario: (<><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>),
  clientes: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>),
  avisos: (<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />),
  turnos: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  reportes: (<path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />),
  logout: (<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />),
  chevron: (<path d="M15 18l-6-6 6-6" />),
}

function Icon({ name }) {
  return (
    <svg
      className="sb-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

// Quién ve cada módulo. Ajusta las rutas (to) a las de tu router.
const MENU = [
  { to: '/dashboard',  label: 'Dashboard',       icon: 'dashboard',  roles: ['admin', 'trabajador'] },
  { to: '/ventas',     label: 'Ventas (POS)',    icon: 'ventas',     roles: ['admin', 'trabajador'], tag: 'F2' },
  { to: '/inventario', label: 'Inventario',      icon: 'inventario', roles: ['admin'],               tag: 'Stock' },
  { to: '/clientes',   label: 'Clientes',        icon: 'clientes',   roles: ['admin', 'trabajador'] },
  { to: '/avisos',     label: 'Avisos de stock', icon: 'avisos',     roles: ['admin', 'trabajador'], alerta: true },
  { to: '/turnos',     label: 'Turnos',          icon: 'turnos',     roles: ['admin', 'trabajador'] },
  { to: '/reportes',   label: 'Reportes',        icon: 'reportes',   roles: ['admin'],               tag: 'Admin' },
]

const ROLE_LABELS = { admin: 'Administrador', trabajador: 'Trabajador' }

export default function Sidebar({
  isOpen = false,            // menú móvil abierto
  onClose,                   // cierra el menú móvil
  isCollapsed,               // barra de 80px solo íconos
  onToggleCollapse,
  collapsed,                 // nombre antiguo (por compatibilidad)
  onToggle,                  // nombre antiguo (por compatibilidad)
  alertCount = 0,
  user: userProp,
  onLogout,
}) {
  const { usuario, logout } = useAuth()
  const user = usuario || userProp
  const rol = user?.rol || 'trabajador'
  const items = MENU.filter((item) => item.roles.includes(rol))

  const isCol = isCollapsed ?? collapsed ?? false
  const toggle = onToggleCollapse ?? onToggle

  const initials = user?.nombre
    ? user.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'NS'

  const handleLogout = onLogout || logout

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isCol ? 'collapsed' : ''} ${isOpen ? 'mobile-open' : ''}`}>
        {/* Logo + botón de contraer */}
        <div className="sidebar-header">
          <img src={logo} alt="Nova Salud Botica" className="sidebar-logo" />
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggle}
            aria-label={isCol ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            <Icon name="chevron" />
          </button>
        </div>

        <div className="sidebar-section sb-label">MÓDULOS PRINCIPALES</div>

        {/* Menú según el rol */}
        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              data-label={item.label}
              aria-label={item.label}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              <span className="sb-label">{item.label}</span>
              {item.alerta && alertCount > 0 && (
                <span className="sb-badge sb-badge-red">{alertCount}</span>
              )}
              {item.tag && <span className="sb-badge">{item.tag}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Usuario + cerrar sesión */}
        <div className="sidebar-footer">
          <div className="sidebar-user" data-label={user?.nombre || 'Usuario'}>
            <div className="sidebar-avatar">{initials}</div>
            <div className="sb-label sidebar-user-info">
              <span className="sidebar-user-name">{user?.nombre || 'Personal Botica'}</span>
              <span className="sidebar-user-role">{ROLE_LABELS[rol] || rol}</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            data-label="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <Icon name="logout" />
            <span className="sb-label">Cerrar sesión</span>
          </button>

          <div className="sidebar-status sb-label">
            <span><span className="sidebar-status-dot">●</span> Servidor en línea</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}