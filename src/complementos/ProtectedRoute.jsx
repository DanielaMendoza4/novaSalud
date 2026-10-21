import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context'
import './ProtectedRoute.css'

/**
 * Componente ProtectedRoute: Control de acceso por sesión y roles (Admin, Vendedor, Almacén).
 * Guiado por trabajoPlan.pdf (Paso 6, 7).
 */
export default function ProtectedRoute({
  children,
  roles,
  user,
  redirectTo = '/login',
  fallbackTo = '/'
}) {
  const auth = useAuth()
  // Prioriza prop user, luego auth context, luego localStorage
  let currentUser = user !== undefined ? user : auth?.usuario
  if (!currentUser) {
    try {
      const stored = localStorage.getItem('usuario')
      currentUser = stored ? JSON.parse(stored) : null
    } catch {
      currentUser = null
    }
  }

  // 1. Si no hay usuario autenticado, redirigir a Login
  if (!currentUser) {
    return <Navigate to={redirectTo} replace />
  }

  // 2. Si la ruta requiere roles específicos y el usuario no los tiene
  const userRole = currentUser.rol || currentUser.role
  if (roles && (!userRole || !roles.includes(userRole))) {
    // Si prefiere redirección automática inmediata:
    if (fallbackTo) {
      return <Navigate to={fallbackTo} replace />
    }

    // Pantalla amigable de permiso denegado
    return (
      <div className="protected-access-denied">
        <div className="access-denied-card">
          <div className="access-denied-icon">🔒</div>
          <h2 className="access-denied-title">Acceso Restringido</h2>
          <p className="access-denied-text">
            Tu rol actual (<strong>{userRole || 'Sin rol'}</strong>) no cuenta con permisos suficientes para acceder a este módulo de Nova Salud.
          </p>
          <div className="access-denied-roles">
            <span>Roles autorizados:</span>
            {roles.map((r) => (
              <span key={r} className="access-role-tag">{r}</span>
            ))}
          </div>
          <div style={{ marginTop: '24px' }}>
            <Link to="/" className="access-denied-btn">
              ← Regresar al Panel Principal
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. Permiso concedido
  return children
}
