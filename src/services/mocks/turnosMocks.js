import { ahoraEnLima } from '../../utils/fechas'
import { resumenMock } from './resumenMocks'

export let turnoMock = null
export const cierreMock = { efectivo_esperado: 620.00, efectivo_contado: 620.00, diferencia: 0.00 }

export const abrirTurnoMock = (fondo_inicial, datos = {}) => {
  turnoMock = {
    id: 7,
    apertura: ahoraEnLima(),
    fondo_inicial,
    estado: 'abierta',
    usuario_dni: datos.dni,
    franja: datos.franja
  }
  resumenMock.trabajador.turno = { id: turnoMock.id, apertura: turnoMock.apertura }
  resumenMock.trabajador.efectivo_en_caja = fondo_inicial
  return turnoMock
}

export const cerrarTurnoMock = (efectivo_contado, datos = {}) => {
  const result = {
    ...cierreMock,
    efectivo_contado,
    diferencia: efectivo_contado - cierreMock.efectivo_esperado
  }
  turnoMock = null
  resumenMock.trabajador.turno = null
  resumenMock.trabajador.efectivo_en_caja = 0
  if (datos.franja === 'noche') {
    resumenMock.trabajador.ventas_hoy = { monto: 0, tickets: 0 }
    resumenMock.trabajador.pagos_digitales = 0
    resumenMock.trabajador.ventas_en_espera = 0
  }
  window.dispatchEvent(new CustomEvent('turno:actualizado', { detail: { franja: datos.franja } }))
  return result
}
