import { request, mockDelay, useMocks } from './http'
import { turnoMock, abrirTurnoMock, cerrarTurnoMock, listarTurnosMock, buscarTrabajadorMock } from './mocks/turnosMocks'

export const turnosService = {
  actual: () => (useMocks ? mockDelay(turnoMock) : request('/turnos/actual')),
  listar: ({ desde = '', hasta = '', page = 1, limit = 50 } = {}) => {
    if (useMocks) return mockDelay(listarTurnosMock())
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    return request(`/turnos?${params}`).then((response) => response.data || [])
  },
  buscarTrabajador: async (dni) =>
    useMocks ? mockDelay(buscarTrabajadorMock(dni)) : request(`/turnos/trabajadores/${encodeURIComponent(dni)}`),
  abrir: async (fondo_inicial, datos = {}) => {
    const response = useMocks
      ? await mockDelay(abrirTurnoMock(fondo_inicial, datos))
      : await request('/turnos/abrir', {
      method: 'POST',
      body: JSON.stringify({ fondo_inicial, franja: datos.franja, usuario_dni: datos.dni })
      })
    if (!useMocks) window.dispatchEvent(new CustomEvent('turno:actualizado', { detail: response }))
    return response
  },
  cerrar: async (efectivo_contado, datos = {}) => {
    const response = useMocks
      ? await mockDelay(cerrarTurnoMock(efectivo_contado, datos))
      : await request('/turnos/cerrar', {
        method: 'POST',
        body: JSON.stringify({ efectivo_contado, franja: datos.franja })
      })
    if (!useMocks) window.dispatchEvent(new CustomEvent('turno:actualizado', { detail: { ...response, franja: datos.franja } }))
    return response
  }
}
