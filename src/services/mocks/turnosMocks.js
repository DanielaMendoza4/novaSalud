import { ApiError } from '../http'
import { usuariosDemo } from '../../data/usuarios'
import { ahoraEnLima } from '../../utils/fechas'
import { resumenMock } from './resumenMocks'

export let turnoMock = null
export const cierreMock = { efectivo_esperado: 620.00, efectivo_contado: 620.00, diferencia: 0.00 }

export const buscarTrabajadorMock = (dni) => {
  const trabajador = usuariosDemo.find((usuario) => usuario.dni === dni)
  if (!trabajador) {
    throw new ApiError({
      codigo: 'TRABAJADOR_NO_ENCONTRADO',
      mensaje: 'No hay ningún trabajador registrado con ese DNI.',
      status: 404
    })
  }
  return { dni: trabajador.dni, nombre: trabajador.nombre }
}

export const abrirTurnoMock = (fondo_inicial, datos = {}) => {
  turnoMock = {
    id: 7,
    apertura: ahoraEnLima(),
    fondo_inicial,
    estado: 'abierta',
    usuario_dni: datos.dni,
    usuario_nombre: datos.nombre,
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
