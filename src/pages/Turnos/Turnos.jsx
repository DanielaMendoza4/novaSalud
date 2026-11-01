import { useEffect, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import Button from '../../components/Button/Button'
import EmptyState from '../../components/EmptyState/EmptyState'
import Field from '../../components/Field/Field'
import Modal from '../../components/Modal/Modal'
import PageHeader from '../../components/PageHeader/PageHeader'
import { turnosService } from '../../services'
import { formatFechaHora } from '../../utils/fechas'
import { mensajeDeError } from '../../utils/errores'
import './Turnos.css'

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`
const texto = (value) => (value ? value : '—')
const turnosDisponibles = ['mañana', 'tarde', 'noche']
const LONGITUD_DNI = 8
// Un turno abierto también trae "diferencia", pero en null: solo el cierre le da un valor.
const esCierre = (data) => typeof data?.diferencia === 'number'

export default function Turnos() {
  const [turno, setTurno] = useState(null)
  const [dni, setDni] = useState('')
  const [busquedaDni, setBusquedaDni] = useState({ dni: '', nombre: '', error: '' })
  const [franja, setFranja] = useState('')
  const [fondo, setFondo] = useState('100.00')
  const [contado, setContado] = useState('')
  const [resultado, setResultado] = useState(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [state, setState] = useState({ loading: true, error: '', saving: false })

  const cargar = () => {
    setState((current) => ({ ...current, loading: true }))
    turnosService.actual().then((data) => {
      setTurno(data)
      setState({ loading: false, error: '', saving: false })
    }).catch((error) => setState({ loading: false, error: mensajeDeError(error), saving: false }))
  }

  useEffect(() => { cargar() }, [])

  // Busca el nombre al completar el DNI; "cancelado" descarta respuestas de un DNI anterior.
  useEffect(() => {
    if (dni.length !== LONGITUD_DNI) return undefined
    let cancelado = false
    turnosService.buscarTrabajador(dni)
      .then((trabajador) => {
        if (!cancelado) setBusquedaDni({ dni, nombre: trabajador.nombre, error: '' })
      })
      .catch((error) => {
        if (!cancelado) setBusquedaDni({ dni, nombre: '', error: mensajeDeError(error) })
      })
    return () => { cancelado = true }
  }, [dni])

  const dniCompleto = dni.length === LONGITUD_DNI
  const busquedaVigente = dniCompleto && busquedaDni.dni === dni
  const nombre = busquedaVigente ? busquedaDni.nombre : ''
  const errorDni = busquedaVigente ? busquedaDni.error : ''

  const ejecutar = async (action) => {
    setState((current) => ({ ...current, saving: true, error: '' }))
    try {
      const data = await action()
      setResultado(data)
      setTurno(esCierre(data) ? null : data)
      setContado('')
      if (esCierre(data)) {
        setDni('')
        setFranja('')
        setFondo('')
      }
      setConfirmClose(false)
      setState({ loading: false, error: '', saving: false })
    } catch (error) {
      setConfirmClose(false)
      setState({ loading: false, error: mensajeDeError(error), saving: false })
    }
  }

  const formularioAperturaValido = Boolean(nombre) && Boolean(franja) && fondo !== '' && Number(fondo) >= 0
  const validCash = contado !== '' && Number.isFinite(Number(contado)) && Number(contado) >= 0
  const abrirCaja = () => ejecutar(async () => {
    return turnosService.abrir(Number(fondo), { franja, dni, nombre })
  })
  if (state.loading) return <div className="shared-card turnos-loading">Cargando turno...</div>

  return (
    <div className="turnos-page">
      <PageHeader title="Turno de caja" subtitle="Controla la apertura y el cierre de tu caja." />
      {state.error && <div className="turnos-error" role="alert">{state.error}</div>}
      <section className="shared-card turnos-card">
        {turno ? (
          <>
            <div className="turnos-card-header">
              <div><span className="turnos-eyebrow">Caja actual</span><h2>Turno #{turno.id}</h2></div>
              <Badge variant="success" dot>Abierto</Badge>
            </div>
            <div className="turnos-details">
              <div><span>Cajero</span><strong>{texto(turno.usuario_nombre)}</strong></div>
              <div><span>DNI</span><strong>{texto(turno.usuario_dni)}</strong></div>
              <div><span>Turno</span><strong className="turnos-capitalize">{texto(turno.franja)}</strong></div>
              <div><span>Apertura</span><strong>{formatFechaHora(turno.apertura)}</strong></div>
              <div><span>Fondo inicial</span><strong className="turnos-money">{money(turno.fondo_inicial)}</strong></div>
            </div>
            <div className="turnos-close-form">
              <Field id="efectivo-contado" label="Efectivo contado" hint="Cuenta todo el efectivo disponible en caja.">
                <div className="turnos-money-input"><span>S/</span><input id="efectivo-contado" type="number" min="0" step="0.01" value={contado} onChange={(event) => setContado(event.target.value)} /></div>
              </Field>
              <Button fullWidth size="lg" disabled={state.saving || !validCash} onClick={() => setConfirmClose(true)}>Cerrar caja</Button>
            </div>
          </>
        ) : (
          <EmptyState icon="+" title="No hay un turno abierto" description="Ingresa tu DNI y abre tu caja para comenzar a registrar ventas. La hora de apertura se registrará automáticamente.">
            <div className="turnos-open-form">
              <Field id="dni-trabajador" label="DNI" error={errorDni} hint={dniCompleto && !busquedaVigente ? 'Buscando trabajador...' : undefined}>
                <input id="dni-trabajador" type="text" inputMode="numeric" autoComplete="off" maxLength={LONGITUD_DNI} placeholder="8 dígitos" value={dni} onChange={(event) => setDni(event.target.value.replace(/\D/g, ''))} />
              </Field>
              <Field id="nombre-trabajador" label="Nombre">
                <input id="nombre-trabajador" type="text" readOnly placeholder="Se completa con el DNI" value={nombre} />
              </Field>
              <Field id="franja-turno" label="Turno">
                <select id="franja-turno" value={franja} onChange={(event) => setFranja(event.target.value)}>
                  <option value="">Selecciona un turno</option>
                  {turnosDisponibles.map((opcion) => <option key={opcion} value={opcion}>{opcion[0].toUpperCase() + opcion.slice(1)}</option>)}
                </select>
              </Field>
              <Field id="fondo-inicial" label="Fondo inicial">
                <div className="turnos-money-input"><span>S/</span><input id="fondo-inicial" type="number" min="0" step="0.01" value={fondo} onChange={(event) => setFondo(event.target.value)} /></div>
              </Field>
              <Button fullWidth disabled={state.saving || !formularioAperturaValido} onClick={abrirCaja}>Abrir caja</Button>
            </div>
          </EmptyState>
        )}
        {esCierre(resultado) && (
          <div className={`turnos-result ${resultado.diferencia === 0 ? 'balanced' : 'unbalanced'}`}>
            <h3>Turno cerrado</h3>
            <div><span>Efectivo esperado</span><strong>{money(resultado.efectivo_esperado)}</strong></div>
            <div><span>Efectivo contado</span><strong>{money(resultado.efectivo_contado)}</strong></div>
            <div><span>Diferencia</span><strong>{money(resultado.diferencia)}</strong></div>
          </div>
        )}
      </section>
      <Modal isOpen={confirmClose} onClose={() => setConfirmClose(false)} title="¿Cerrar caja?" footer={<><Button variant="outline" onClick={() => setConfirmClose(false)}>Cancelar</Button><Button onClick={() => ejecutar(() => turnosService.cerrar(Number(contado), { franja: turno?.franja }))} loading={state.saving}>Confirmar cierre</Button></>}> 
        <p>Vas a cerrar el turno con un efectivo contado de <strong>{money(contado)}</strong>. Se registrará la hora de cierre automáticamente.</p>
      </Modal>
    </div>
  )
}
