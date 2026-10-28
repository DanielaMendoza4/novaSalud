const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const TOKEN_KEY = 'novasalud_token'

export class ApiError extends Error {
  constructor({ codigo, mensaje, status }) {
    super(mensaje)
    this.name = 'ApiError'
    this.codigo = codigo
    this.mensaje = mensaje
    this.status = status
  }
}

const parseBody = async (response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError({
      codigo: 'ERROR_SERVIDOR',
      mensaje: 'El servidor devolvió una respuesta inválida.',
      status: response.status
    })
  }
}

export const request = async (path, options = {}) => {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError({
      codigo: 'RED_NO_DISPONIBLE',
      mensaje: 'No se pudo conectar con el servidor.',
      status: 0
    })
  }

  let body
  try {
    body = await parseBody(response)
  } catch (error) {
    if (response.status === 401) {
      localStorage.removeItem('novasalud_token')
      localStorage.removeItem('novasalud_usuario')
      window.location.assign('/login')
    }
    throw error
  }
  if (!response.ok) {
    const error = body?.error || {}
    if (response.status === 401) {
      localStorage.removeItem('novasalud_token')
      localStorage.removeItem('novasalud_usuario')
      window.location.assign('/login')
    }
    throw new ApiError({
      codigo: error.codigo || 'ERROR_API',
      mensaje: error.mensaje || 'Ocurrió un error en la solicitud.',
      status: response.status
    })
  }
  return body
}

export const mockDelay = (value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), 250))

export const useMocks =
  String(import.meta.env.VITE_USE_MOCKS || 'true').toLowerCase() === 'true'
