import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import './Layout.css'

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Componente Layout: Envoltorio principal de la aplicación.
 * Conecta el Sidebar y la zona de contenido dinámico.
 * Guiado por trabajoPlan.pdf (Paso 7, 9).
 */
export default function Layout({
  children,
  user = { nombre: 'Daniel Mendoza', rol: 'admin', sucursal: 'Botica Central' },
  alertas,
  onLogout
}) {
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const closeMobileSidebar = () => {
    setIsSidebarMobileOpen(false)
  }

  const toggleCollapseSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  return (
    <div className="novasalud-layout">
      {/* Barra lateral de navegación */}
      <Sidebar
        isOpen={isSidebarMobileOpen}
        onClose={closeMobileSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleCollapseSidebar}
        alertCount={alertas?.length ?? 3}
        user={user}
        onLogout={onLogout}
      />

      {/* Contenedor principal con margen dinámico */}
      <div
        className={`layout-main-wrapper ${
          isSidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        {/* Botón de menú: solo visible en pantallas pequeñas */}
        <button
          type="button"
          className="layout-mobile-menu-btn"
          onClick={() => setIsSidebarMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        {/* Área de vistas / páginas */}
        <main className="layout-content-area">
          {children || <Outlet />}
        </main>

        {/* Pie de página del sistema */}
        <footer className="layout-footer">
          <div>
            © {CURRENT_YEAR} <strong>Nova Salud</strong> — Sistema Integral de Gestión Farmacéutica y Punto de Venta.
          </div>
          <div className="layout-footer-links">
            <span className="layout-footer-link">Soporte Técnico</span>
            <span>•</span>
            <span className="layout-footer-link">Manual de Usuario</span>
          </div>
        </footer>
      </div>
    </div>
  )
}