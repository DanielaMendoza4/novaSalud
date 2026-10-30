
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
    localStorage.removeItem(CLAVE_USUARIO)
    localStorage.removeItem(CLAVE_TOKEN)
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado)
  const [validandoSesion, setValidandoSesion] = useState(
    () => Boolean(localStorage.getItem(CLAVE_TOKEN))
  )

  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN)

    if (!token) {
      setValidandoSesion(false)
      return
    }

    let activo = true

    authService.me()
      .then((response) => {
        if (!activo) return

        const usuarioActual = response?.usuario

        if (
          usuarioActual &&
          ['admin', 'trabajador'].includes(usuarioActual.rol)
        ) {
          setUsuario(usuarioActual)
          localStorage.setItem(
            CLAVE_USUARIO,
            JSON.stringify(usuarioActual)
          )
        } else {
          localStorage.removeItem(CLAVE_USUARIO)
          localStorage.removeItem(CLAVE_TOKEN)
          setUsuario(null)
        }
      })
      .catch(() => {
        if (!activo) return

        localStorage.removeItem(CLAVE_USUARIO)
        localStorage.removeItem(CLAVE_TOKEN)
        setUsuario(null)
      })
      .finally(() => {
        if (activo) setValidandoSesion(false)
      })

    return () => {
      activo = false
    }
  }, [])

  const login = async ({ email, password }) => {
    const response = await authService.login({ email, password })

    if (!response?.token || !response?.usuario) {
      throw new Error('La respuesta de autenticación no es válida.')
    }

    const usuarioAutenticado = response.usuario

    if (!['admin', 'trabajador'].includes(usuarioAutenticado.rol)) {
      throw new Error('El usuario no tiene un rol autorizado.')
    }

    localStorage.setItem(CLAVE_TOKEN, response.token)
    localStorage.setItem(
      CLAVE_USUARIO,
      JSON.stringify(usuarioAutenticado)
    )

    setUsuario(usuarioAutenticado)
    return usuarioAutenticado
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
