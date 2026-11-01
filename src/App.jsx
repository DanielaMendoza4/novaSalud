import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Login from './components/Login/Login'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import RoleRoute from './components/RoleRoute/RoleRoute'
import { AuthProvider, DatosProvider, useAuth } from './context'
import Dashboard from './pages/Dashboard/Dashboard'
import Ventas from './pages/Ventas/Ventas'
import Clientes from './pages/Clientes/Clientes'
import Turnos from './pages/Turnos/Turnos'
import Avisos from './pages/Avisos/Avisos'
import Inventario from './pages/Inventario/Inventario'
import Reportes from './pages/Reportes/Reportes'
import './App.css'

function AppRoutes() {
  const { usuario, logout, validandoSesion } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (validandoSesion) {
    return <div className="panel-card">Validando sesión...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout user={usuario} onLogout={handleLogout} /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="ventas" element={<RoleRoute roles={['admin', 'trabajador']}><Ventas /></RoleRoute>} />
        <Route path="clientes" element={<RoleRoute roles={['admin', 'trabajador']}><Clientes /></RoleRoute>} />
        <Route path="turnos" element={<RoleRoute roles={['admin', 'trabajador']}><Turnos /></RoleRoute>} />
        <Route path="avisos" element={<RoleRoute roles={['admin', 'trabajador']}><Avisos /></RoleRoute>} />
        <Route path="inventario" element={<RoleRoute roles={['admin']}><Inventario /></RoleRoute>} />
        <Route path="reportes" element={<RoleRoute roles={['admin']}><Reportes /></RoleRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DatosProvider>
          <AppRoutes />
        </DatosProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
