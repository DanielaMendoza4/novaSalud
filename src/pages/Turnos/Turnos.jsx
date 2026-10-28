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

export default function Turnos() {
  const [turno, setTurno] = useState(null)
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

  const ejecutar = async (action) => {
    setState((current) => ({ ...current, saving: true, error: '' }))
    try {
      const data = await action()
      setResultado(data)
      setTurno('diferencia' in data ? null : data)
      setContado('')
      setConfirmClose(false)
      setState({ loading: false, error: '', saving: false })
    } catch (error) {
      setConfirmClose(false)
      setState({ loading: false, error: mensajeDeError(error), saving: false })
    }
  }

  const validCash = contado !== '' && Number.isFinite(Number(contado)) && Number(contado) >= 0
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
          <EmptyState icon="+" title="No hay un turno abierto" description="Abre tu caja para comenzar a registrar ventas.">
            <div className="turnos-open-form">
              <Field id="fondo-inicial" label="Fondo inicial">
                <div className="turnos-money-input"><span>S/</span><input id="fondo-inicial" type="number" min="0" step="0.01" value={fondo} onChange={(event) => setFondo(event.target.value)} /></div>
              </Field>
              <Button fullWidth disabled={state.saving || Number(fondo) < 0} onClick={() => ejecutar(() => turnosService.abrir(Number(fondo)))}>Abrir caja</Button>
            </div>
          </EmptyState>
        )}
        {resultado?.diferencia !== undefined && (
          <div className={`turnos-result ${resultado.diferencia === 0 ? 'balanced' : 'unbalanced'}`}>
            <h3>Turno cerrado</h3>
            <div><span>Efectivo esperado</span><strong>{money(resultado.efectivo_esperado)}</strong></div>
            <div><span>Efectivo contado</span><strong>{money(resultado.efectivo_contado)}</strong></div>
            <div><span>Diferencia</span><strong>{money(resultado.diferencia)}</strong></div>
          </div>
        )}
      </section>
      <Modal isOpen={confirmClose} onClose={() => setConfirmClose(false)} title="¿Cerrar caja?" footer={<><Button variant="outline" onClick={() => setConfirmClose(false)}>Cancelar</Button><Button onClick={() => ejecutar(() => turnosService.cerrar(Number(contado)))} loading={state.saving}>Confirmar cierre</Button></>}>
        <p>Vas a cerrar el turno con un efectivo contado de <strong>{money(contado)}</strong>. Esta acción registrará el cierre de caja.</p>
      </Modal>
    </div>
  )
}
