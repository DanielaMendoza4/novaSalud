import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context'

export default function RoleRoute({ roles, children, fallbackTo = '/' }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (!roles.includes(usuario.rol)) return <Navigate to={fallbackTo} replace />
  return children
}
