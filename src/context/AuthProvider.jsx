import { useEffect, useState } from 'react'
import AuthContext from './AuthContext'
import { authService } from '../services'

const CLAVE_USUARIO = 'novasalud_usuario'
const CLAVE_TOKEN = 'novasalud_token'

const leerUsuarioGuardado = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIO)
    const usuario = guardado ? JSON.parse(guardado) : null
    if (!usuario || !['admin', 'trabajador'].includes(usuario.rol)) {
      localStorage.removeItem(CLAVE_USUARIO)
      localStorage.removeItem(CLAVE_TOKEN)
      return null
    }
    return usuario
  } catch {
    return null
  }
}

/**
 * Proveedor de autenticación conectado al contrato de API.
 * En modo mock, authService usa las cuentas de demostración.
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado)
  const [validandoSesion, setValidandoSesion] = useState(() => Boolean(localStorage.getItem(CLAVE_TOKEN)))

  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN)
    if (!token) return

    authService.me()
      .then((response) => {
        if (response?.usuario && ['admin', 'trabajador'].includes(response.usuario.rol)) {
          setUsuario(response.usuario)
          localStorage.setItem(CLAVE_USUARIO, JSON.stringify(response.usuario))
        } else {
          localStorage.removeItem(CLAVE_USUARIO)
          localStorage.removeItem(CLAVE_TOKEN)
          setUsuario(null)
        }
      })
      .catch(() => {
        setUsuario(null)
        localStorage.removeItem(CLAVE_USUARIO)
        localStorage.removeItem(CLAVE_TOKEN)
      })
      .finally(() => setValidandoSesion(false))
  }, [])

  const login = async ({ email, password }) => {
    const response = await authService.login({ email, password })
    localStorage.setItem(CLAVE_TOKEN, response.token)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(response.usuario))
    setUsuario(response.usuario)
    return response.usuario
  }

  const logout = () => {
    localStorage.removeItem(CLAVE_USUARIO)
    localStorage.removeItem(CLAVE_TOKEN)
    setUsuario(null)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        setUsuario,
        isAuthenticated: Boolean(usuario),
        validandoSesion
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
