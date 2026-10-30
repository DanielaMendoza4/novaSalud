import { request, mockDelay, useMocks } from './http'
import { turnoMock, abrirTurnoMock, cerrarTurnoMock } from './mocks/turnosMocks'

export const turnosService = {
  actual: () => (useMocks ? mockDelay(turnoMock) : request('/turnos/actual')),
  abrir: (fondo_inicial) => (useMocks
    ? mockDelay(abrirTurnoMock(fondo_inicial))
    : request('/turnos/abrir', {
      method: 'POST',
      body: JSON.stringify({ fondo_inicial })
    })),
  cerrar: (efectivo_contado) => (useMocks
    ? mockDelay(cerrarTurnoMock(efectivo_contado))
    : request('/turnos/cerrar', {
      method: 'POST',
      body: JSON.stringify({ efectivo_contado })
    }))
}
