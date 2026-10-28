import { useEffect, useMemo, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import EmptyState from '../../components/EmptyState/EmptyState'
import PageHeader from '../../components/PageHeader/PageHeader'
import { avisosService } from '../../services'
import { mensajeDeError } from '../../utils/errores'
import './Avisos.css'

const severity = { agotado: 0, stock_bajo: 1, por_vencer: 2 }
const labels = {
  agotado: { text: 'Agotado', variant: 'danger', dot: 'danger' },
  stock_bajo: { text: 'Stock bajo', variant: 'warning', dot: 'warning' },
  por_vencer: { text: 'Por vencer', variant: 'warning', dot: 'warning' }
}

export default function Avisos() {
  const [avisos, setAvisos] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    avisosService.listar()
      .then((data) => { setAvisos(data); setState({ loading: false, error: '' }) })
      .catch((error) => setState({ loading: false, error: mensajeDeError(error) }))
  }, [])

  const ordered = useMemo(() => [...avisos].sort((a, b) => (severity[a.tipo] ?? 9) - (severity[b.tipo] ?? 9)), [avisos])
  const counts = useMemo(() => avisos.reduce((result, aviso) => ({ ...result, [aviso.tipo]: (result[aviso.tipo] || 0) + 1 }), {}), [avisos])

  return (
    <div className="avisos-page">
      <PageHeader title="Avisos de stock" subtitle="Revisa los productos que requieren atención." />
      {state.error && <div className="avisos-error" role="alert">{state.error}</div>}
      {state.loading ? <div className="shared-card avisos-loading">Cargando avisos...</div> : (
        <section className="shared-card avisos-card">
          <div className="avisos-summary">
            <div><strong>{avisos.length}</strong><span>Avisos activos</span></div>
            <div><strong className="danger-text">{counts.agotado || 0}</strong><span>Agotados</span></div>
            <div><strong className="warning-text">{counts.stock_bajo || 0}</strong><span>Stock bajo</span></div>
            <div><strong className="warning-text">{counts.por_vencer || 0}</strong><span>Por vencer</span></div>
          </div>
          {ordered.length === 0 ? <EmptyState icon="✓" title="No hay avisos de stock. Todo en orden." /> : (
            <div className="avisos-list">
              {ordered.map((aviso) => {
                const status = labels[aviso.tipo] || labels.stock_bajo
                return (
                  <article className="aviso-row" key={`${aviso.producto_id}-${aviso.tipo}`}>
                    <span className={`aviso-dot ${status.dot}`} aria-hidden="true" />
                    <div className="aviso-content">
                      <strong>{aviso.nombre}</strong>
                      <span>{aviso.detalle}</span>
                    </div>
                    <Badge variant={status.variant}>{status.text}</Badge>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
