import { useState } from 'react'
import AuthContext from './AuthContext'
import { usuariosDemo } from '../data/usuarios'

const CLAVE_USUARIO = 'novasalud_usuario'
const CLAVE_TOKEN = 'novasalud_token'
const CLAVES_ANTERIORES = ['usuario', 'token']

const leerUsuarioGuardado = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIO)
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

const limpiarSesionGuardada = () => {
  localStorage.removeItem(CLAVE_USUARIO)
  localStorage.removeItem(CLAVE_TOKEN)
  CLAVES_ANTERIORES.forEach((clave) => localStorage.removeItem(clave))
}

/**
 * Proveedor de autenticación simulada para Nova Salud.
 * Valida las cuentas de src/data/usuarios.js y persiste solo
 * los datos públicos de la sesión (nunca la contraseña).
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    // Elimina sesiones de la versión anterior para que el login sea obligatorio.
    CLAVES_ANTERIORES.forEach((clave) => localStorage.removeItem(clave))
    return leerUsuarioGuardado()
  })

  const login = async ({ email, password, rol }) => {
    // Pequeña espera para mostrar el estado de carga del formulario.
    await new Promise((resolve) => setTimeout(resolve, 450))

    const correo = email.trim().toLowerCase()
    const cuenta = usuariosDemo.find(
      (usuarioDemo) => usuarioDemo.email.toLowerCase() === correo
    )

    if (!cuenta || cuenta.password !== password) {
      throw new Error('Correo o contraseña incorrectos.')
    }

    if (cuenta.rol !== rol) {
      throw new Error(
        'Esta cuenta no corresponde al tipo de acceso seleccionado.'
      )
    }

    const sesion = {
      id: cuenta.id,
      nombre: cuenta.nombre,
      email: cuenta.email,
      rol: cuenta.rol,
      cargo: cuenta.cargo,
      sucursal: cuenta.sucursal
    }

    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion))
    localStorage.setItem(
      CLAVE_TOKEN,
      `mock-jwt-${cuenta.id}-${Date.now()}`
    )
    setUsuario(sesion)

    return sesion
  }

  const logout = () => {
    limpiarSesionGuardada()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        setUsuario,
        isAuthenticated: Boolean(usuario)
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
