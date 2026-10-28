import { useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate
} from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Card from './components/Card/Card'
import Modal from './components/Modal/Modal'
import Badge from './components/Badge/Badge'
import Button from './components/Button/Button'
import Table from './components/Table/Table'
import SearchBar from './components/SearchBar/SearchBar'
import Toast from './components/Toast/Toast'
import Login from './components/Login/Login'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import { AuthProvider, DatosProvider, useAuth, useDatos } from './context'
import Ventas from './pages/Ventas/Ventas'
import Clientes from './pages/Clientes/Clientes'
import './App.css'

// Vista del Dashboard con uso de componentes según trabajoPlan.pdf
function DashboardDemo() {
  const { productos } = useDatos()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalType, setModalType] = useState('pos') // 'pos' | 'producto'
  const [busqueda, setBusqueda] = useState('')
  const [toastInfo, setToastInfo] = useState(null)

  const productosFiltrados = productos.filter(
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
          <h1> Panel Administrativo-Botica Nova Salud</h1>
        </div>
        <div className="dashboard-hero-actions">
          <Button
            variant="success"
            onClick={() => {
              setModalType('pos')
              setModalAbierto(true)
            }}
          >
            Nueva Venta 
          </Button>
          <Button
            variant="success"
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
            variant="primary"
            trend={{ direction: 'up', text: '+14.2% vs ayer' }}
          />

          <Card
            title="Stock Bajo"
            value="8 productos"
            subtitle="Por debajo del stock mínimo"
            variant="danger"
            trend={{ direction: 'down', text: '3 críticos' }}
          />

          <Card
            title="Por Vencer (<30 días)"
            value="5 lotes"
            subtitle="Rotación FEFO requerida"
            variant="warning"
          />

          <Card
            title="Total en Inventario"
            value="1,240 ítems"
            subtitle="En 8 categorías activas"
            variant="info"
          />
        </div>
      </div>

      {/* Sección con Grilla: Tabla de Stock con Buscador POS y Guía de Complementos */}
      <div className="dashboard-grid-2col">
        {/* Tabla Modular de Productos con SearchBar */}
        <div className="panel-card">
          <div className="dashboard-section-title">
            <span>Control de Inventario</span>
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
              <span>Mostrando {data.length} de {productos.length} medicamentos en inventario</span>
            )}
          />
        </div>

      </div>

      {/* Modal Reutilizable */}
      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={modalType === 'pos' ? 'Punto de Venta — Nueva Venta Rápida' : 'Registrar Nuevo Producto'}
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
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta (POS)</option>
              <option value="yape">Yape / Plin</option>
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
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout user={usuario} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardDemo />} />
        <Route
          path="/ventas"
          element={
            <ProtectedRoute roles={['admin', 'vendedor']}>
              <Ventas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario"
          element={
            <ProtectedRoute roles={['admin', 'almacen']}>
              <PlaceholderPage
                title="Gestión de Inventario"
                description="CRUD de productos, control de lotes, fechas de vencimiento y registro de ingresos."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute roles={['admin', 'vendedor']}>
              <Clientes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alertas"
          element={
            <ProtectedRoute roles={['admin', 'vendedor', 'almacen']}>
              <PlaceholderPage
                title="Centro de Alertas de Farmacia"
                description="Monitoreo de quiebres de stock, medicamentos próximos a caducar y reposiciones pendientes."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute roles={['admin']}>
              <PlaceholderPage
                title="Reportes y Estadísticas"
                description="Métricas de ventas, rotación de productos, márgenes y exportación a formatos CSV y PDF."
              />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <DatosProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </DatosProvider>
    </AuthProvider>
  )
}

export default App
