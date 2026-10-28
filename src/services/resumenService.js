import { request, mockDelay, useMocks } from './http'
import { resumenMock } from './mocks/resumenMocks'

export const resumenService = {
  obtener: (rol) => {
    const normalizedRole = rol === 'vendedor' ? 'trabajador' : rol
    return useMocks
      ? mockDelay(resumenMock[normalizedRole])
      : request('/resumen')
  }
}
