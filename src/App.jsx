import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {
  Layout,
  Card,
  Modal,
  Badge,
  Button,
  Table,
  SearchBar,
  Toast
} from './complementos'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

// Vista del Dashboard con uso de complementos según trabajoPlan.pdf
function DashboardDemo() {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalType, setModalType] = useState('pos') // 'pos' | 'producto'
  const [busqueda, setBusqueda] = useState('')
  const [toastInfo, setToastInfo] = useState(null)

  const productosIniciales = [
    {
      id: 1,
      codigo: 'MED-001',
      nombre: 'Paracetamol 500mg Tab x100',
      stock: 3,
      minimo: 15,
      estado: 'stock_bajo',
      estadoLabel: 'Stock Bajo',
      precio: 8.50
    },
    {
      id: 2,
      codigo: 'MED-002',
      nombre: 'Amoxicilina 500mg Cap x20',
      stock: 24,
      minimo: 10,
      estado: 'por_vencer',
      estadoLabel: 'Vence en 18d',
      precio: 18.00
    },
    {
      id: 3,
      codigo: 'MED-003',
      nombre: 'Ibuprofeno 400mg Tab x50',
      stock: 0,
      minimo: 20,
      estado: 'agotado',
      estadoLabel: 'Agotado',
      precio: 12.00
    },
    {
      id: 4,
      codigo: 'MED-004',
      nombre: 'Loratadina 10mg Tab x30',
      stock: 45,
      minimo: 15,
      estado: 'normal',
      estadoLabel: 'Normal',
      precio: 15.50
    },
    {
      id: 5,
      codigo: 'MED-005',
      nombre: 'Omeprazol 20mg Cap x30',
      stock: 60,
      minimo: 20,
      estado: 'normal',
      estadoLabel: 'Normal',
      precio: 22.00
    }
  ]

  const productosFiltrados = productosIniciales.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  )

  const columnasInventario = [
    {
      header: 'Código',
      key: 'codigo',
      render: (codigo) => <strong>{codigo}</strong>
    },
    {
      header: 'Medicamento',
      key: 'nombre'
    },
    {
      header: 'Stock Actual',
      key: 'stock',
      align: 'center',
      render: (stock, row) => (
        <strong style={{ color: stock <= row.minimo ? '#ef4444' : '#15803d' }}>
          {stock}
        </strong>
      )
    },
    {
      header: 'Mínimo',
      key: 'minimo',
      align: 'center'
    },
    {
      header: 'Estado',
      key: 'estado',
      render: (_, row) => {
        const variants = {
          stock_bajo: 'danger',
          por_vencer: 'warning',
          agotado: 'danger',
          normal: 'success'
        }
        return (
          <Badge variant={variants[row.estado] || 'neutral'} dot>
            {row.estadoLabel}
          </Badge>
        )
      }
    },
    {
      header: 'Acción',
      key: 'id',
      align: 'right',
      render: (_, row) => (
        <Button
          size="sm"
          variant={row.stock === 0 ? 'primary' : 'outline'}
          onClick={() => {
            setToastInfo({
              type: 'info',
              title: 'Reposición Solicitada',
              message: `Se generó solicitud de reposición para ${row.nombre}`
            })
          }}
        >
          {row.stock === 0 ? 'Ordenar' : 'Reponer'}
        </Button>
      )
    }
  ]

  return (
    <div className="dashboard-view">
      {/* Notificación Toast flotante */}
      {toastInfo && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 3000 }}>
          <Toast
            type={toastInfo.type}
            title={toastInfo.title}
            message={toastInfo.message}
            onClose={() => setToastInfo(null)}
          />
        </div>
      )}

      {/* Banner Principal */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h1>Botica Nova Salud — Panel de Control</h1>
          <p>
            Sistema web de gestión de inventario y punto de venta automatizado con control de stock en tiempo real, alertas de vencimiento y registro de ventas.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Button
            variant="success"
            icon="🛒"
            onClick={() => {
              setModalType('pos')
              setModalAbierto(true)
            }}
          >
            Nueva Venta (F2)
          </Button>
          <Button
            variant="outline"
            style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}
            icon="📦"
            onClick={() => {
              setModalType('producto')
              setModalAbierto(true)
            }}
          >
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI según Paso 11 de trabajoPlan.pdf */}
      <div>
        <h2 className="dashboard-section-title">
          <span>Resumen de Operaciones</span>
          <Badge variant="primary" dot>En Vivo</Badge>
        </h2>
        <div className="kpi-grid">
          <Card
            title="Ventas del Día"
            value="S/ 2,480.50"
            subtitle="42 transacciones realizadas"
            icon="💵"
            variant="primary"
            trend={{ direction: 'up', text: '+14.2% vs ayer' }}
          />

          <Card
            title="Stock Bajo"
            value="8 productos"
            subtitle="Por debajo del stock mínimo"
            icon="⚠️"
            variant="danger"
            trend={{ direction: 'down', text: '3 críticos' }}
          />

          <Card
            title="Por Vencer (<30 días)"
            value="5 lotes"
            subtitle="Rotación FEFO requerida"
            icon="⏳"
            variant="warning"
          />

          <Card
            title="Total en Inventario"
            value="1,240 ítems"
            subtitle="En 8 categorías activas"
            icon="💊"
            variant="info"
          />
        </div>
      </div>

      {/* Sección con Grilla: Tabla de Stock con Buscador POS y Guía de Complementos */}
      <div className="dashboard-grid-2col">
        {/* Tabla Modular de Productos con SearchBar */}
        <div className="panel-card">
          <div className="dashboard-section-title">
            <span>Control de Inventario y Alertas (Paso 8 y 9)</span>
            <Badge variant="neutral">{productosFiltrados.length} medicamentos</Badge>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <SearchBar
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Escanear código de barras o escribir medicamento... (Enter)"
            />
          </div>

          <Table
            columns={columnasInventario}
            data={productosFiltrados}
            emptyMessage="No se encontraron medicamentos con el término ingresado."
            renderFooter={(data) => (
              <span>Mostrando {data.length} de {productosIniciales.length} medicamentos en inventario</span>
            )}
          />
        </div>

        {/* Panel lateral: Catálogo de Complementos Creados */}
        <div className="panel-card">
          <h3 className="dashboard-section-title">
            <span>Carpeta /complementos</span>
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
            Se han estructurado los componentes modulares y sus archivos CSS correspondientes según <code>trabajoPlan.pdf</code>:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <strong>🧭 Navbar</strong> (<code>Navbar.jsx</code> + <code>Navbar.css</code>)
              <div style={{ color: '#64748b' }}>Barra superior con buscador POS, datos de usuario y campana.</div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <strong>📑 Sidebar</strong> (<code>Sidebar.jsx</code> + <code>Sidebar.css</code>)
              <div style={{ color: '#64748b' }}>Menú lateral con módulos (Dashboard, POS, Inventario, etc.).</div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <strong>🔔 AlertBell</strong> (<code>AlertBell.jsx</code> + <code>AlertBell.css</code>)
              <div style={{ color: '#64748b' }}>Campana con contador dinámico y dropdown de alertas.</div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <strong>🛡️ ProtectedRoute</strong> (<code>ProtectedRoute.jsx</code> + <code>ProtectedRoute.css</code>)
              <div style={{ color: '#64748b' }}>Seguridad por roles conectada a AuthContext.</div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <strong>🖼️ Layout</strong> (<code>Layout.jsx</code> + <code>Layout.css</code>)
              <div style={{ color: '#64748b' }}>Envoltorio responsivo con sidebar y navbar adaptables.</div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <strong>📋 Table & SearchBar</strong> (<code>Table</code> + <code>SearchBar</code>)
              <div style={{ color: '#64748b' }}>Tabla responsiva y buscador optimizado con autofocus lector POS.</div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <strong>💬 Toast & Modal</strong> (<code>Toast</code> + <code>Modal</code>)
              <div style={{ color: '#64748b' }}>Notificaciones flotantes y diálogos modales accesibles.</div>
            </div>

            <div style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
              <strong>✨ Card, Badge & Button</strong>
              <div style={{ color: '#64748b' }}>Elementos atómicos de interfaz con estilos propios.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Reutilizable */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modalType === 'pos' ? 'Punto de Venta — Nueva Venta Rápida' : 'Registrar Nuevo Producto'}
        icon={modalType === 'pos' ? '🛒' : '💊'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setToastInfo({
                  type: 'success',
                  title: '¡Operación Exitosa!',
                  message: modalType === 'pos' ? 'Venta registrada y comprobante generado.' : 'Producto guardado en inventario.'
                })
                setModalAbierto(false)
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        {modalType === 'pos' ? (
          <div>
            <p>Simulación de cobro rápido con descuento automático de stock.</p>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Subtotal:</span>
                <strong>S/ 35.00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>IGV (18%):</span>
                <span>S/ 6.30</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#0d9488', fontWeight: '800' }}>
                <span>Total a Cobrar:</span>
                <span>S/ 41.30</span>
              </div>
            </div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Método de Pago:
            </label>
            <select
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                background: '#ffffff'
              }}
            >
              <option value="efectivo">💵 Efectivo</option>
              <option value="tarjeta">💳 Tarjeta (POS)</option>
              <option value="yape">📱 Yape / Plin</option>
            </select>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Nombre del Medicamento:</label>
                <input
                  type="text"
                  placeholder="Ej: Azitromicina 500mg"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Stock Mínimo:</label>
                  <input
                    type="number"
                    defaultValue="15"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Precio Venta (S/):</label>
                  <input
                    type="number"
                    defaultValue="12.50"
                    step="0.10"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function PlaceholderPage({ title, icon, description }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>{icon}</div>
      <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 8px 0', color: '#0f172a' }}>{title}</h2>
      <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto 20px auto' }}>{description}</p>
      <Badge variant="primary">Módulo de Botica Nova Salud</Badge>
    </div>
  )
}

function AppContent() {
  const { usuario } = useAuth()

  return (
    <Routes>
      <Route element={<Layout user={usuario} />}>
        <Route path="/" element={<DashboardDemo />} />
        <Route
          path="/ventas"
          element={
            <PlaceholderPage
              title="Punto de Venta (POS)"
              icon="🛒"
              description="Búsqueda rápida por código de barras, carrito de compras y emisión de comprobantes."
            />
          }
        />
        <Route
          path="/inventario"
          element={
            <PlaceholderPage
              title="Gestión de Inventario"
              icon="💊"
              description="CRUD de productos, control de lotes, fechas de vencimiento y registro de ingresos."
            />
          }
        />
        <Route
          path="/clientes"
          element={
            <PlaceholderPage
              title="Directorio de Clientes"
              icon="👥"
              description="Búsqueda por DNI, registro de fidelización y seguimiento del historial de compras."
            />
          }
        />
        <Route
          path="/alertas"
          element={
            <PlaceholderPage
              title="Centro de Alertas de Farmacia"
              icon="🔔"
              description="Monitoreo de quiebres de stock, medicamentos próximos a caducar y reposiciones pendientes."
            />
          }
        />
        <Route
          path="/reportes"
          element={
            <PlaceholderPage
              title="Reportes y Estadísticas"
              icon="📈"
              description="Métricas de ventas, rotación de productos, márgenes y exportación a formatos CSV y PDF."
            />
          }
        />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
