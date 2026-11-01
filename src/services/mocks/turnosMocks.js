import { ahoraEnLima } from '../../utils/fechas'
import { usuariosDemo } from '../../data/usuarios'
import { resumenMock } from './resumenMocks'
import { ventasMock } from './ventasMocks'

const STORAGE_KEY = 'novasalud_turnos_mock'

const money = (value) => Math.round((Number(value) || 0) * 100) / 100

const leerSesion = () => {
  if (typeof localStorage === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem('novasalud_usuario') || 'null')
  } catch {
    return null
  }
}

const cuentaDemo = (id) => usuariosDemo.find((cuenta) => cuenta.id === id)

const datosCajero = () => {
  const sesion = leerSesion()
  const cuenta = usuariosDemo.find(
    (item) => item.email?.toLowerCase() === sesion?.email?.toLowerCase()
  )
  return {
    usuario_id: sesion?.id ?? cuenta?.id ?? null,
    usuario_nombre: sesion?.nombre || cuenta?.nombre || 'Cajero',
    usuario_dni: cuenta?.dni || '-'
  }
}

const fechaLima = (diasAtras, hora, minuto) => {
  const base = new Date(Date.now() - diasAtras * 86400000)
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(base).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value
    return result
  }, {})

  return `${partes.year}-${partes.month}-${partes.day}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00-05:00`
}

const turnosDemo = () => {
  const manana = cuentaDemo(1)
  const tarde = cuentaDemo(2)
  const noche = cuentaDemo(1)

  return [
    {
      id: 1,
      franja: 'mañana',
      apertura: fechaLima(3, 8, 5),
      cierre: fechaLima(3, 14, 10),
      fondo_inicial: 100,
      ventas: 250.5,
      ventas_efectivo: 250.5,
      efectivo_esperado: 350.5,
      efectivo_contado: 350.5,
      diferencia: 0,
      estado: 'cerrada',
      usuario_id: manana?.id ?? null,
      usuario_nombre: manana?.nombre || 'Daniel Mendoza',
      usuario_dni: manana?.dni || '-',
      observaciones: 'Caja cuadrada al cierre del turno mañana.',
      demo: true
    },
    {
      id: 2,
      franja: 'tarde',
      apertura: fechaLima(2, 14, 2),
      cierre: fechaLima(2, 20, 15),
      fondo_inicial: 100,
      ventas: 180,
      ventas_efectivo: 120,
      efectivo_esperado: 220,
      efectivo_contado: 210,
      diferencia: -10,
      estado: 'cerrada',
      usuario_id: tarde?.id ?? null,
      usuario_nombre: tarde?.nombre || 'Lucía Torres',
      usuario_dni: tarde?.dni || '-',
      observaciones: 'Faltante de S/ 10.00 reportado al cierre.',
      demo: true
    },
    {
      id: 3,
      franja: 'noche',
      apertura: fechaLima(1, 20, 3),
      cierre: fechaLima(1, 23, 30),
      fondo_inicial: 80,
      ventas: 145.5,
      ventas_efectivo: 100,
      efectivo_esperado: 180,
      efectivo_contado: 185.5,
      diferencia: 5.5,
      estado: 'cerrada',
      usuario_id: noche?.id ?? null,
      usuario_nombre: noche?.nombre || 'Daniel Mendoza',
      usuario_dni: noche?.dni || '-',
      observaciones: '',
      demo: true
    }
  ]
}

const guardarTurnos = (turnos) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(turnos))
  } catch {
    // Sin persistencia disponible: el historial sigue viviendo en memoria.
  }
}

const cargarTurnos = () => {
  if (typeof localStorage === 'undefined') return turnosDemo()
  try {
    const guardado = localStorage.getItem(STORAGE_KEY)
    if (guardado === null) {
      const semilla = turnosDemo()
      guardarTurnos(semilla)
      return semilla
    }
    const turnos = JSON.parse(guardado)
    return Array.isArray(turnos) ? turnos : turnosDemo()
  } catch {
    return turnosDemo()
  }
}

let turnos = cargarTurnos()

export let turnoMock = turnos.find((turno) => turno.estado === 'abierta') || null
export const cierreMock = { efectivo_esperado: 0, efectivo_contado: 0, diferencia: 0 }

if (turnoMock) {
  resumenMock.trabajador.turno = { id: turnoMock.id, apertura: turnoMock.apertura }
  resumenMock.trabajador.efectivo_en_caja = turnoMock.fondo_inicial
}

const efectivoDeVenta = (venta) => {
  if (Array.isArray(venta.pagos) && venta.pagos.length) {
    return venta.pagos
      .filter((pago) => pago.metodo === 'efectivo')
      .reduce((total, pago) => total + Number(pago.monto || 0), 0)
  }
  return venta.metodo_pago === 'efectivo' ? Number(venta.total || 0) : 0
}

export const listarTurnosMock = () => turnos.map((turno) => ({ ...turno }))

export const abrirTurnoMock = (fondo_inicial, datos = {}) => {
  const cajero = datosCajero()
  const id = Math.max(0, ...turnos.map((turno) => Number(turno.id) || 0)) + 1

  turnoMock = {
    id,
    franja: datos.franja || '',
    apertura: ahoraEnLima(),
    cierre: null,
    fondo_inicial: money(fondo_inicial),
    ventas: 0,
    ventas_efectivo: 0,
    efectivo_esperado: null,
    efectivo_contado: null,
    diferencia: null,
    estado: 'abierta',
    usuario_id: cajero.usuario_id,
    usuario_nombre: cajero.usuario_nombre,
    usuario_dni: datos.dni || cajero.usuario_dni,
    observaciones: '',
    demo: false
  }

  turnos = [...turnos, turnoMock]
  guardarTurnos(turnos)

  resumenMock.trabajador.turno = { id: turnoMock.id, apertura: turnoMock.apertura }
  resumenMock.trabajador.efectivo_en_caja = turnoMock.fondo_inicial
  return turnoMock
}

export const cerrarTurnoMock = (efectivo_contado, datos = {}) => {
  const turno = turnoMock || turnos.find((actual) => actual.estado === 'abierta')
  if (!turno) return { ...cierreMock }

  const ventasDelTurno = ventasMock.filter(
    (venta) => Number(venta.turno_id) === Number(turno.id) && venta.estado === 'pagada'
  )
  const ventasTotal = ventasDelTurno.reduce((total, venta) => total + Number(venta.total || 0), 0)
  const ventasEfectivo = ventasDelTurno.reduce((total, venta) => total + efectivoDeVenta(venta), 0)
  const efectivoEsperado = Number(turno.fondo_inicial || 0) + ventasEfectivo
  const contado = money(efectivo_contado)

  const cerrado = {
    ...turno,
    cierre: ahoraEnLima(),
    ventas: money(ventasTotal),
    ventas_efectivo: money(ventasEfectivo),
    efectivo_esperado: money(efectivoEsperado),
    efectivo_contado: contado,
    diferencia: money(contado - efectivoEsperado),
    estado: 'cerrada'
  }

  turnos = turnos.map((actual) => (actual.id === turno.id ? cerrado : actual))
  turnoMock = null
  guardarTurnos(turnos)

  resumenMock.trabajador.turno = null
  resumenMock.trabajador.efectivo_en_caja = 0
  if (datos.franja === 'noche') {
    resumenMock.trabajador.ventas_hoy = { monto: 0, tickets: 0 }
    resumenMock.trabajador.pagos_digitales = 0
    resumenMock.trabajador.ventas_en_espera = 0
  }
  window.dispatchEvent(new CustomEvent('turno:actualizado', { detail: { franja: datos.franja } }))
  return cerrado
}
