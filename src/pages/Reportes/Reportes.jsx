import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Badge from '../../components/Badge/Badge'
import Button from '../../components/Button/Button'
import Card from '../../components/Card/Card'
import EmptyState from '../../components/EmptyState/EmptyState'
import PageHeader from '../../components/PageHeader/PageHeader'
import Table from '../../components/Table/Table'
import { reportesService } from '../../services'
import { mensajeDeError } from '../../utils/errores'
import './Reportes.css'

const money = (value) => `S/ ${Number(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const dateValue = (date) => date.toISOString().slice(0, 10)
const today = dateValue(new Date())
const subtractDays = (days) => { const date = new Date(); date.setDate(date.getDate() - days); return dateValue(date) }
const initialRange = { desde: subtractDays(29), hasta: today }
const methodLabels = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin', tarjeta: 'Tarjeta' }
const methodColors = ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6']

const formatDay = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })

export default function Reportes() {
  const [range, setRange] = useState(initialRange)
  const [preset, setPreset] = useState('30')
  const [report, setReport] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })

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

  const exportCsv = () => reportesService.descargarCsv(range).catch((error) => setState((current) => ({ ...current, error: mensajeDeError(error) })))
  const kpis = report?.kpis || {}
  const hasSales = Boolean(report?.ventasPorDia?.some((day) => Number(day.total) > 0))
  const paymentTotal = useMemo(() => (report?.metodosPago || []).reduce((sum, item) => sum + Number(item.total || 0), 0), [report])
  const maxTopUnits = Math.max(...(report?.topProductos || []).map((item) => Number(item.unidades || 0)), 1)
  const paymentLabel = (method) => methodLabels[method] || method || 'Sin pago'
  const formatSaleDate = (value) => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Lima' }).format(new Date(value))

  return (
    <div className="reportes-page">
      <PageHeader
        title="Reportes"
        subtitle="Resumen de ventas, caja e inventario de la botica."
        action={<div className="reportes-header-actions"><Button variant="outline" onClick={exportCsv}>Exportar CSV</Button><Button onClick={() => window.print()}>Exportar PDF</Button></div>}
      />
      <section className="reportes-filters" aria-label="Filtros de fecha">
        <div className="reportes-filter-chips">{[['1', 'Hoy'], ['7', '7 días'], ['30', '30 días'], ['custom', 'Rango personalizado']].map(([value, label]) => <button key={value} type="button" className={preset === value ? 'active' : ''} onClick={() => selectPreset(value)}>{label}</button>)}</div>
        {preset === 'custom' && <div className="reportes-date-inputs"><label>Desde<input type="date" value={range.desde} max={range.hasta} onChange={(event) => handleDate('desde', event.target.value)} /></label><label>Hasta<input type="date" value={range.hasta} min={range.desde} max={today} onChange={(event) => handleDate('hasta', event.target.value)} /></label></div>}
      </section>
      {state.error && <div className="reportes-error" role="alert"><span>{state.error}</span><Button variant="outline" size="sm" onClick={load}>Reintentar</Button></div>}
      {state.loading && <div className="reportes-loading" role="status">Cargando reportes...</div>}
      {!state.loading && !state.error && report && <>
        {!hasSales && <div className="reportes-empty"><EmptyState icon="◷" title="No hay ventas en este periodo" description="Prueba con otro rango de fechas." /></div>}
        <div className="reportes-kpis">
          <Card title="Ventas de hoy" value={money(kpis.ventasHoy?.monto)} subtitle={`${Number(kpis.ventasHoy?.variacion || 0).toFixed(1)}% frente a ayer`} variant="primary" />
          <Card title="Ventas del periodo" value={money(kpis.ventasPeriodo?.monto)} subtitle={`${kpis.ventasPeriodo?.comprobantes || 0} comprobantes`} variant="success" />
          <Card title="Ticket promedio" value={money(kpis.ticketPromedio)} subtitle="Por venta pagada" variant="info" />
          <Card title="Productos en alerta" value={kpis.productosAlerta || 0} subtitle="Requieren atención" variant="warning" />
        </div>
        <div className="reportes-grid">
          <section className="reportes-panel"><div className="reportes-panel-heading"><div><h2>Ventas por día</h2><p>Total vendido y cantidad de ventas.</p></div></div><div className="reportes-chart" role="img" aria-label="Gráfico de ventas por día"><ResponsiveContainer width="100%" height="100%"><AreaChart data={report.ventasPorDia || []}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8efed" /><XAxis dataKey="dia" tickFormatter={formatDay} tick={{ fontSize: 11 }} /><YAxis tickFormatter={(value) => `S/${value}`} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => money(value)} labelFormatter={formatDay} /><Area type="monotone" dataKey="total" stroke="#0d9488" fill="#b9e5d7" fillOpacity={0.65} strokeWidth={2} /></AreaChart></ResponsiveContainer></div></section>
          <section className="reportes-panel"><div className="reportes-panel-heading"><div><h2>Métodos de pago</h2><p>Distribución del periodo.</p></div></div>{paymentTotal ? <div className="reportes-payment"><div className="reportes-pie" role="img" aria-label="Gráfico circular de métodos de pago"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={report.metodosPago} dataKey="total" nameKey="metodo" innerRadius={48} outerRadius={76} paddingAngle={3}>{report.metodosPago.map((item, index) => <Cell key={item.metodo} fill={methodColors[index % methodColors.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} /></PieChart></ResponsiveContainer></div><div className="reportes-legend">{report.metodosPago.map((item, index) => <div key={item.metodo}><span className="reportes-dot" style={{ background: methodColors[index % methodColors.length] }} /><span>{methodLabels[item.metodo] || item.metodo}</span><strong>{Math.round(Number(item.total) / paymentTotal * 100)}%</strong></div>)}</div></div> : <EmptyState icon="◌" title="Sin pagos registrados" />}</section>
        </div>
        <div className="reportes-grid">
          <section className="reportes-panel"><div className="reportes-panel-heading"><div><h2>Productos más vendidos</h2><p>Top 10 por unidades.</p></div></div>{report.topProductos?.length ? <div className="reportes-top-products" role="img" aria-label="Barras horizontales de productos más vendidos">{report.topProductos.map((item) => <div className="reportes-top-product" key={item.id}><div className="reportes-top-product-label"><strong>{item.nombre}</strong><span>{item.unidades} unidades</span></div><div className="reportes-top-product-track"><span style={{ width: `${Math.max(Number(item.unidades || 0) / maxTopUnits * 100, 4)}%` }} /></div></div>)}</div> : <EmptyState icon="▤" title="No hay productos vendidos" />}</section>
          <section className="reportes-panel reportes-sales-panel"><div className="reportes-panel-heading"><div><h2>Detalle de ventas</h2><p>{report.detalleVentas?.length || 0} operaciones completadas.</p></div><Badge variant="success">Completadas</Badge></div><Table className="reportes-sales-table" columns={[{ header: 'Fecha', key: 'fecha', render: (value) => formatSaleDate(value) }, { header: 'Venta', key: 'serie_numero' }, { header: 'Cliente', key: 'cliente' }, { header: 'Pago', key: 'metodo_pago', render: (value) => paymentLabel(value) }, { header: 'Unidades', key: 'unidades' }, { header: 'Total', key: 'total', align: 'right', render: (value) => <strong>{money(value)}</strong> }]} data={report.detalleVentas || []} emptyMessage="No hay ventas completadas en este periodo." emptyIcon="◷" /></section>
        </div>
      </>}
    </div>
  )
}
