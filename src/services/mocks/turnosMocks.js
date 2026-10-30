import { ahoraEnLima } from '../../utils/fechas'

export let turnoMock = null
export const cierreMock = { efectivo_esperado: 620.00, efectivo_contado: 620.00, diferencia: 0.00 }

export const abrirTurnoMock = (fondo_inicial) => {
  turnoMock = { id: 7, apertura: ahoraEnLima(), fondo_inicial, estado: 'abierta' }
  return turnoMock
}

export const cerrarTurnoMock = (efectivo_contado) => {
  const result = {
    ...cierreMock,
    efectivo_contado,
    diferencia: efectivo_contado - cierreMock.efectivo_esperado
  }
  turnoMock = null
  return result
}
