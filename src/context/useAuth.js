import { useContext } from 'react'
import AuthContext from './AuthContext'

/**
 * Hook useAuth para acceder al contexto de autenticación.
 * Si se usa fuera de AuthProvider, devuelve una sesión vacía.
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    return {
      usuario: null,
      isAuthenticated: false,
      login: async () => {
        throw new Error('AuthProvider no está disponible.')
      },
      logout: () => {},
      setUsuario: () => {}
    }
  }

  return context
}

export default useAuth
