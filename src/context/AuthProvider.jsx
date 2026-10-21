import { useState } from 'react'
import AuthContext from './AuthContext'

/**
 * Proveedor de Autenticación y Roles según Paso 6 de trabajoPlan.pdf
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('usuario')
      return guardado
        ? JSON.parse(guardado)
        : { nombre: 'Daniel Mendoza', rol: 'admin', sucursal: 'Botica Central' }
    } catch {
      return { nombre: 'Daniel Mendoza', rol: 'admin', sucursal: 'Botica Central' }
    }
  })

  const login = async (email, _password) => {
    const usuarioMock = {
      nombre: email ? email.split('@')[0] : 'Administrador',
      rol: 'admin',
      email: email || 'admin@novasalud.pe',
      sucursal: 'Botica Central'
    }
    localStorage.setItem('token', 'mock-jwt-token')
    localStorage.setItem('usuario', JSON.stringify(usuarioMock))
    setUsuario(usuarioMock)
    return usuarioMock
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, setUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
