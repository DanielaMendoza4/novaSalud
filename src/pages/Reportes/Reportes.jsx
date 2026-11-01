import { useEffect, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import EmptyState from '../../components/EmptyState/EmptyState'
import PageHeader from '../../components/PageHeader/PageHeader'
import Table from '../../components/Table/Table'
import { reportesService, turnosService } from '../../services'
import { mensajeDeError } from '../../utils/errores'
import { formatFechaHora } from '../../utils/fechas'
import './Reportes.css'

const money = (value) => `S/ ${Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dateValue = (date) => date.toISOString().slice(0, 10)
const today = dateValue(new Date())
const subtractDays = (days) => { const date = new Date(); date.setDate(date.getDate() - days); return dateValue(date) }
const initialRange = { desde: subtractDays(29), hasta: today }
const methodLabels = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin', tarjeta: 'Tarjeta' }
const franjas = { mañana: { numero: 1, label: 'Mañana' }, tarde: { numero: 2, label: 'Tarde' }, noche: { numero: 3, label: 'Noche' } }

const turnoLabel = (turno) => {
  const franja = franjas[turno.franja]
  return franja ? `${franja.numero} · ${franja.label}` : turno.franja || 'Sin iniciar'
}

const estadoTurno = (estado) => {
  if (estado === 'abierta') return { label: 'Abierto', variant: 'success' }
  if (estado === 'cerrada') return { label: 'Cerrado', variant: 'neutral' }
  return { label: 'Sin iniciar', variant: 'warning' }
}

const diferenciaClass = (value) => {
  const numero = Number(value || 0)
  if (numero === 0) return 'reportes-diff-zero'
  return numero < 0 ? 'reportes-diff-negative' : 'reportes-diff-positive'
}

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
const csvRows = (rows) => rows.map((row) => row.map(csvCell).join(',')).join('\r\n')

export default function Reportes() {
  const [range, setRange] = useState(initialRange)
  const [preset, setPreset] = useState('30')
  const [turnoFiltro, setTurnoFiltro] = useState('')
  const [cajeroFiltro, setCajeroFiltro] = useState('')
  const [report, setReport] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [turnosState, setTurnosState] = useState({ loading: true })
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    let activo = true
    turnosService.listar().then((data) => {
      if (!activo) return
      setTurnos(Array.isArray(data) ? data : [])
      setTurnosState({ loading: false })
    }).catch(() => {
      if (activo) setTurnosState({ loading: false })
    })
    return () => { activo = false }
  }, [])

  const load = () => {
    setState({ loading: true, error: '' })
    reportesService.obtener(range).then(setReport).catch((error) => setState({ loading: false, error: mensajeDeError(error) })).finally(() => setState((current) => ({ ...current, loading: false })))
  }

  useEffect(() => { load() }, [range.desde, range.hasta])

  const selectPreset = (value) => {
    setPreset(value)
    if (value === 'custom') return
    const days = Number(value)
    setRange({ desde: days === 1 ? today : subtractDays(days - 1), hasta: today })
  }

  const handleDate = (key, value) => {
    setPreset('custom')
    setRange((current) => ({ ...current, [key]: value }))
  }

  const kpis = report?.kpis || {}
  const hasSales = Boolean(report?.ventasPorDia?.some((day) => Number(day.total) > 0))
  const maxTopUnits = Math.max(...(report?.topProductos || []).map((item) => Number(item.unidades || 0)), 1)
  const paymentLabel = (method) => methodLabels[method] || method || 'Sin pago'
  const formatSaleDate = (value) => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Lima' }).format(new Date(value))

  const cajeros = [...new Set(turnos.map((turno) => turno.usuario_nombre).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b))
  const filtrandoTurnos = Boolean(turnoFiltro || cajeroFiltro)
  const turnosPorId = new Map(turnos.map((turno) => [Number(turno.id), turno]))

  const ventasFiltradas = (report?.detalleVentas || []).filter((venta) => {
    if (!filtrandoTurnos) return true
    const turno = turnosPorId.get(Number(venta.turno_id))
    if (!turno) return false
    if (turnoFiltro && turno.franja !== turnoFiltro) return false
    if (cajeroFiltro && turno.usuario_nombre !== cajeroFiltro) return false
    return true
  })

  const ventasPeriodoMonto = filtrandoTurnos
    ? ventasFiltradas.reduce((total, venta) => total + Number(venta.total || 0), 0)
    : Number(kpis.ventasPeriodo?.monto || 0)
  const comprobantesPeriodo = filtrandoTurnos ? ventasFiltradas.length : Number(kpis.ventasPeriodo?.comprobantes || 0)
  const ticketPromedio = filtrandoTurnos
    ? (ventasFiltradas.length ? ventasPeriodoMonto / ventasFiltradas.length : 0)
    : Number(kpis.ticketPromedio || 0)
  const ventasHoyMonto = filtrandoTurnos
    ? ventasFiltradas
      .filter((venta) => String(venta.fecha).slice(0, 10) === today)
      .reduce((total, venta) => total + Number(venta.total || 0), 0)
    : Number(kpis.ventasHoy?.monto || 0)

  const ventasDelTurno = (turno) => {
    const registradas = (report?.detalleVentas || [])
      .filter((venta) => Number(venta.turno_id) === Number(turno.id))
      .reduce((total, venta) => total + Number(venta.total || 0), 0)
    if (turno.estado === 'abierta') return registradas
    return turno.ventas !== undefined && turno.ventas !== null ? Number(turno.ventas || 0) : registradas
  }

  const turnosDelPeriodo = turnos
    .filter((turno) => {
      if (!turno.apertura) return false
      const dia = String(turno.apertura).slice(0, 10)
      if (dia < range.desde || dia > range.hasta) return false
      if (turnoFiltro && turno.franja !== turnoFiltro) return false
      if (cajeroFiltro && turno.usuario_nombre !== cajeroFiltro) return false
      return true
    })
    .sort((a, b) => String(b.apertura).localeCompare(String(a.apertura)))

  const turnosConObservaciones = turnosDelPeriodo.filter((turno) => turno.observaciones)
  const diferenciaCaja = turnosDelPeriodo
    .filter((turno) => turno.estado === 'cerrada')
    .reduce((total, turno) => total + Number(turno.diferencia || 0), 0)
  const diferenciaVariant = Math.abs(diferenciaCaja) < 0.005 ? 'success' : diferenciaCaja < 0 ? 'danger' : 'warning'

  const exportCsv = () => {
    const filas = [
      ['Reporte Nova Salud', `${range.desde} a ${range.hasta}`],
      ['Filtros', turnoFiltro ? turnoLabel({ franja: turnoFiltro }) : 'Todos los turnos', cajeroFiltro || 'Todos los cajeros'],
      [],
      ['TURNOS DE CAJA'],
      ['Turno', 'Cajero', 'DNI', 'Apertura', 'Cierre', 'Fondo inicial', 'Ventas', 'Efectivo contado', 'Diferencia', 'Estado', 'Observaciones'],
      ...turnosDelPeriodo.map((turno) => [
        turnoLabel(turno),
        turno.usuario_nombre || '',
        turno.usuario_dni || '',
        turno.apertura ? formatFechaHora(turno.apertura) : '',
        turno.cierre ? formatFechaHora(turno.cierre) : '—',
        Number(turno.fondo_inicial || 0).toFixed(2),
        ventasDelTurno(turno).toFixed(2),
        turno.efectivo_contado !== null && turno.efectivo_contado !== undefined ? Number(turno.efectivo_contado).toFixed(2) : '—',
        turno.diferencia !== null && turno.diferencia !== undefined ? Number(turno.diferencia).toFixed(2) : '—',
        estadoTurno(turno.estado).label,
        turno.observaciones || ''
      ]),
      [],
      ['DETALLE DE VENTAS'],
      ['Fecha', 'Venta', 'Cliente', 'Pago', 'Unidades', 'Total'],
      ...(report?.detalleVentas || []).map((venta) => [
        formatSaleDate(venta.fecha),
        venta.serie_numero || '',
        venta.cliente || 'Cliente general',
        paymentLabel(venta.metodo_pago),
        Number(venta.unidades || 0),
        Number(venta.total || 0).toFixed(2)
      ])
    ]

    const csv = `\uFEFF${csvRows(filas)}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-${range.desde}-${range.hasta}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="reportes-page">
      <PageHeader
        title="Reportes"
        subtitle="Resumen de ventas, caja e inventario de la botica."
        action={<div className="reportes-header-actions"><Button variant="outline" onClick={exportCsv}>Exportar CSV</Button><Button onClick={() => window.print()}>Exportar PDF</Button></div>}
      />
      <section className="reportes-filters" aria-label="Filtros de reportes">
        <div className="reportes-filter-group">
          <div className="reportes-filter-chips">{[['1', 'Hoy'], ['7', '7 días'], ['30', '30 días'], ['custom', 'Rango personalizado']].map(([value, label]) => <button key={value} type="button" className={preset === value ? 'active' : ''} onClick={() => selectPreset(value)}>{label}</button>)}</div>
          {preset === 'custom' && <div className="reportes-date-inputs"><label>Desde<input type="date" value={range.desde} max={range.hasta} onChange={(event) => handleDate('desde', event.target.value)} /></label><label>Hasta<input type="date" value={range.hasta} min={range.desde} max={today} onChange={(event) => handleDate('hasta', event.target.value)} /></label></div>}
        </div>
        <div className="reportes-filter-selects">
          <label>Turno<select value={turnoFiltro} onChange={(event) => setTurnoFiltro(event.target.value)}><option value="">Todos</option><option value="mañana">1 Mañana</option><option value="tarde">2 Tarde</option><option value="noche">3 Noche</option></select></label>
          <label>Cajero<select value={cajeroFiltro} onChange={(event) => setCajeroFiltro(event.target.value)}><option value="">Todos</option>{cajeros.map((cajero) => <option key={cajero} value={cajero}>{cajero}</option>)}</select></label>
        </div>
      </section>
      {state.error && <div className="reportes-error" role="alert"><span>{state.error}</span><Button variant="outline" size="sm" onClick={load}>Reintentar</Button></div>}
      {state.loading && <div className="reportes-loading" role="status">Cargando reportes...</div>}
      {!state.loading && !state.error && report && <>
        {!hasSales && <div className="reportes-empty"><EmptyState icon="◷" title="No hay ventas en este periodo" description="Prueba con otro rango de fechas." /></div>}
        <div className="reportes-kpis">
          <Card title="Ventas de hoy" value={money(ventasHoyMonto)} subtitle={filtrandoTurnos ? 'Según filtros seleccionados' : `${Number(kpis.ventasHoy?.variacion || 0).toFixed(1)}% frente a ayer`} variant="primary" />
          <Card title="Ventas del periodo" value={money(ventasPeriodoMonto)} subtitle={`${comprobantesPeriodo} comprobantes`} variant="success" />
          <Card title="Ticket promedio" value={money(ticketPromedio)} subtitle="Por venta pagada" variant="info" />
          <Card title="Productos en alerta" value={kpis.productosAlerta || 0} subtitle="Requieren atención" variant="warning" />
          <Card title="Diferencia de caja" value={money(diferenciaCaja)} subtitle="Sobrante / faltante" variant={diferenciaVariant} />
        </div>
        <section className="reportes-panel reportes-turnos-panel">
          <div className="reportes-panel-heading"><div><h2>Turnos de caja</h2><p>Quién atendió, en qué horario y si la caja cuadró.</p></div></div>
          {turnosState.loading ? <div className="reportes-turnos-loading">Cargando turnos...</div> : turnosDelPeriodo.length === 0 ? <EmptyState icon="▤" title="Sin turnos registrados" /> : (
            <>
              <Table
                className="reportes-turnos-table"
                columns={[
                  { header: 'Turno', key: 'id', render: (_, turno) => <span>{turnoLabel(turno)}{turno.demo && <Badge variant="neutral" size="sm" className="reportes-turno-demo">Demo</Badge>}</span> },
                  { header: 'Cajero', key: 'usuario_nombre', render: (value) => value || '—' },
                  { header: 'DNI', key: 'usuario_dni', render: (value) => value || '—' },
                  { header: 'Apertura', key: 'apertura', render: (value) => value ? formatFechaHora(value) : '—' },
                  { header: 'Cierre', key: 'cierre', render: (value) => value ? formatFechaHora(value) : '—' },
                  { header: 'Fondo inicial', key: 'fondo_inicial', align: 'right', render: (value) => money(value) },
                  { header: 'Ventas', key: 'ventas', align: 'right', render: (_, turno) => money(ventasDelTurno(turno)) },
                  { header: 'Efectivo contado', key: 'efectivo_contado', align: 'right', render: (value) => value !== null && value !== undefined ? money(value) : '—' },
                  { header: 'Diferencia', key: 'diferencia', align: 'right', render: (value) => value !== null && value !== undefined ? <span className={diferenciaClass(value)}>{money(value)}</span> : '—' },
                  { header: 'Estado', key: 'estado', render: (value) => { const estado = estadoTurno(value); return <Badge variant={estado.variant}>{estado.label}</Badge> } }
                ]}
                data={turnosDelPeriodo}
              />
              {turnosConObservaciones.length > 0 && (
                <div className="reportes-turnos-notes">
                  {turnosConObservaciones.map((turno) => <p key={turno.id}><strong>{turnoLabel(turno)}:</strong> {turno.observaciones}</p>)}
                </div>
              )}
            </>
          )}
        </section>
        <div className="reportes-grid">
          <section className="reportes-panel"><div className="reportes-panel-heading"><div><h2>Productos más vendidos</h2><p>Top 10 por unidades.</p></div></div>{report.topProductos?.length ? <div className="reportes-top-products" role="img" aria-label="Barras horizontales de productos más vendidos">{report.topProductos.map((item) => <div className="reportes-top-product" key={item.id}><div className="reportes-top-product-label"><strong>{item.nombre}</strong><span>{item.unidades} unidades</span></div><div className="reportes-top-product-track"><span style={{ width: `${Math.max(Number(item.unidades || 0) / maxTopUnits * 100, 4)}%` }} /></div></div>)}</div> : <EmptyState icon="▤" title="No hay productos vendidos" />}</section>
          <section className="reportes-panel reportes-sales-panel"><div className="reportes-panel-heading"><div><h2>Detalle de ventas</h2><p>{report.detalleVentas?.length || 0} operaciones completadas.</p></div><Badge variant="success">Completadas</Badge></div><Table className="reportes-sales-table" columns={[{ header: 'Fecha', key: 'fecha', render: (value) => formatSaleDate(value) }, { header: 'Venta', key: 'serie_numero' }, { header: 'Cliente', key: 'cliente' }, { header: 'Pago', key: 'metodo_pago', render: (value) => paymentLabel(value) }, { header: 'Unidades', key: 'unidades' }, { header: 'Total', key: 'total', align: 'right', render: (value) => <strong>{money(value)}</strong> }]} data={report.detalleVentas || []} emptyMessage="No hay ventas completadas en este periodo." emptyIcon="◷" /></section>
        </div>
      </>}
    </div>
  )
}
