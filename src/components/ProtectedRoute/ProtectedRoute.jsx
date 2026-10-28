import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context'

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
  const currentUser = user !== undefined ? user : auth?.usuario

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />
  }

  const userRole = currentUser.rol || currentUser.role
  if (roles && (!userRole || !roles.includes(userRole))) {
    return <Navigate to={fallbackTo} replace />
  }

  return children
}
