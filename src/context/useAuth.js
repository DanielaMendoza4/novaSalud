import { useContext } from 'react'
import AuthContext from './AuthContext'

/**
 * Hook useAuth para acceder al contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return {
      usuario: { nombre: 'Daniel Mendoza', rol: 'admin', sucursal: 'Botica Central' },
      login: async () => {},
      logout: () => {},
      setUsuario: () => {}
    }
  }
  return context
}

export default useAuth
