import { useMemo, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import Button from '../../components/Button/Button'
import EmptyState from '../../components/EmptyState/EmptyState'
import PageHeader from '../../components/PageHeader/PageHeader'
import Table from '../../components/Table/Table'
import { useDatos } from '../../context/useDatos'
import { formatFechaHora } from '../../utils/fechas'
import './Reportes.css'

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const initialFromDate = () => {
  const date = new Date()
  date.setDate(date.getDate() - 29)
  return localDate(date)
}
const completed = (sale) => ['completada', 'pagada'].includes(sale.estado)

function downloadCsv(rows) {
  const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const content = [
    ['Fecha', 'Venta', 'Cliente', 'Método de pago', 'Total'],
    ...rows.map((sale) => [
      sale.fecha,
      sale.id,
      sale.clienteNombre || 'Cliente general',
      sale.metodoPago || sale.pagos?.map((payment) => payment.metodo).join(', ') || '—',
      Number(sale.total || 0).toFixed(2)
    ])
  ].map((row) => row.map(escapeCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'reporte-ventas.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function Reportes() {
  const { ventas, productos } = useDatos()
  const [fromDate, setFromDate] = useState(initialFromDate)
  const [toDate, setToDate] = useState(() => localDate(new Date()))
  const invalidRange = fromDate && toDate && fromDate > toDate

  const filteredSales = useMemo(() => {
    if (invalidRange) return []
    return ventas
      .filter((sale) => completed(sale))
      .filter((sale) => {
        const saleDate = sale.fecha.slice(0, 10)
        return (!fromDate || saleDate >= fromDate) && (!toDate || saleDate <= toDate)
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [ventas, fromDate, toDate, invalidRange])

  const summary = useMemo(() => {
    const total = filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
    const units = filteredSales.reduce((sum, sale) =>
      sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.cantidad || 0), 0), 0)
    const productSales = new Map()
    filteredSales.forEach((sale) => (sale.items || []).forEach((item) => {
      const key = item.productoId ?? item.producto_id ?? item.nombre
      const current = productSales.get(key) || { nombre: item.nombre, unidades: 0, total: 0 }
      current.unidades += Number(item.cantidad || 0)
      current.total += Number(item.precio ?? item.precio_unitario ?? 0) * Number(item.cantidad || 0)
      productSales.set(key, current)
    }))
    const productNames = new Map(productos.map((product) => [product.id, product.nombre]))
    const bestSellers = [...productSales.entries()]
      .map(([key, product]) => ({ ...product, nombre: product.nombre || productNames.get(key) || 'Producto' }))
      .sort((a, b) => b.unidades - a.unidades || b.total - a.total)
    return {
      total,
      units,
      transactions: filteredSales.length,
      average: filteredSales.length ? total / filteredSales.length : 0,
      bestSellers
    }
  }, [filteredSales, productos])

  const salesColumns = [
    { header: 'Fecha', key: 'fecha', render: (date) => formatFechaHora(date) },
    { header: 'Venta', key: 'id' },
    { header: 'Cliente', key: 'clienteNombre', render: (name) => name || 'Cliente general' },
    { header: 'Pago', key: 'metodoPago', render: (method, sale) => method || sale.pagos?.map((payment) => payment.metodo).join(', ') || '—' },
    { header: 'Unidades', key: 'items', render: (items = []) => items.reduce((sum, item) => sum + Number(item.cantidad || 0), 0) },
    { header: 'Total', key: 'total', render: (total) => <strong>{money(total)}</strong> }
  ]
  const productsColumns = [
    { header: 'Producto', key: 'nombre', render: (name) => <strong>{name}</strong> },
    { header: 'Unidades vendidas', key: 'unidades' },
    { header: 'Importe estimado', key: 'total', render: (total) => money(total) }
  ]

  return (
    <div className="reports-page">
      <PageHeader
        title="Reportes"
        subtitle="Consulta las ventas completadas y los productos más vendidos."
        action={<Button variant="outline" onClick={() => downloadCsv(filteredSales)} disabled={!filteredSales.length}>Descargar CSV</Button>}
      />
      <section className="shared-card reports-filters">
        <div>
          <h2>Periodo del reporte</h2>
          <p>Las ventas anuladas o en espera no se incluyen en los totales.</p>
        </div>
        <div className="reports-date-fields">
          <label>Desde<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label>Hasta<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label>
        </div>
      </section>
      {invalidRange && <div className="reports-feedback" role="alert">La fecha inicial no puede ser posterior a la fecha final.</div>}
      <div className="reports-summary">
        <article className="shared-card"><span>Ventas netas</span><strong>{money(summary.total)}</strong></article>
        <article className="shared-card"><span>Transacciones</span><strong>{summary.transactions}</strong></article>
        <article className="shared-card"><span>Unidades vendidas</span><strong>{summary.units}</strong></article>
        <article className="shared-card"><span>Ticket promedio</span><strong>{money(summary.average)}</strong></article>
      </div>
      <section className="shared-card reports-section">
        <div className="reports-section-heading">
          <div><h2>Productos más vendidos</h2><p>Ordenados por unidades vendidas en el periodo.</p></div>
          <Badge variant="neutral">{summary.bestSellers.length} productos</Badge>
        </div>
        {summary.bestSellers.length
          ? <Table columns={productsColumns} data={summary.bestSellers} className="reports-table" />
          : <EmptyState icon="▤" title="No hay ventas de productos en este periodo" description="Ajusta el rango de fechas para consultar otros resultados." />}
      </section>
      <section className="shared-card reports-section">
        <div className="reports-section-heading">
          <div><h2>Detalle de ventas</h2><p>{summary.transactions} operaciones completadas.</p></div>
          <Badge variant="success">Completadas</Badge>
        </div>
        {filteredSales.length
          ? <Table columns={salesColumns} data={filteredSales} className="reports-table" />
          : <EmptyState icon="▤" title="No hay ventas en este periodo" description="Prueba seleccionando un rango de fechas diferente." />}
      </section>
      <p className="reports-note">Reporte calculado con los datos disponibles en esta sesión de demostración.</p>
    </div>
  )
}
