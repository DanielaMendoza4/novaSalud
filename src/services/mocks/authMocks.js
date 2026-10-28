import { ApiError } from '../http'
import { usuariosDemo } from '../../data/usuarios'

export const mockLogin = ({ email, password }) => {
  const cuenta = usuariosDemo.find((item) =>
    item.email.toLowerCase() === email.trim().toLowerCase() &&
    item.password === password
  )
  if (!cuenta) {
    throw new ApiError({
      codigo: 'CREDENCIALES_INVALIDAS',
      mensaje: 'Correo o contraseña incorrectos.',
      status: 401
    })
  }
  return {
    token: `mock-token-${cuenta.id}`,
    usuario: {
      id: cuenta.id,
      nombre: cuenta.nombre,
      email: cuenta.email,
      rol: cuenta.rol
    }
  }
}

export const mockMe = () => {
  const raw = localStorage.getItem('novasalud_usuario')
  return { usuario: raw ? JSON.parse(raw) : null }
}
