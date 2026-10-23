import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import Sidebar from '../Sidebar/Sidebar'
import './Layout.css'

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Componente Layout: Envoltorio principal de la aplicación.
 * Conecta Navbar, Sidebar y la zona de contenido dinámico.
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

  const toggleMobileSidebar = () => {
    setIsSidebarMobileOpen((prev) => !prev)
  }

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
        userRole={user?.rol || 'admin'}
        alertCount={alertas?.length ?? 3}
      />

      {/* Contenedor principal con margen dinámico */}
      <div
        className={`layout-main-wrapper ${
          isSidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        {/* Barra de cabecera */}
        <Navbar
          onToggleSidebar={toggleMobileSidebar}
          user={user}
          onLogout={onLogout}
          alertas={alertas}
        />

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
