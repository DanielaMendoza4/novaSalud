import { request, mockDelay, useMocks } from './http'
import { avisosMock } from './mocks/avisosMocks'

export const avisosService = {
  listar: () => (useMocks ? mockDelay(avisosMock) : request('/avisos-stock'))
}
