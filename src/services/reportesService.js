import { mockDelay, request, useMocks } from './http'
import { productosMock } from './mocks/productosMocks'
import { ventasDetalleMock, ventasMock } from './mocks/ventasMocks'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const TOKEN_KEY = 'novasalud_token'

const toDate = (value) => String(value).slice(0, 10)
const formatDate = (value) => new Date(`${value}T12:00:00`)

const listarDetalleVentas = async ({ desde, hasta }) => {
  const query = `estado=pagada&desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&limit=100`
  const firstPage = await request(`/ventas?${query}&page=1`)
  const sales = [...(firstPage.data || [])]
  const totalPages = Math.ceil(Number(firstPage.total || sales.length) / 100)
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await request(`/ventas?${query}&page=${page}`)
    sales.push(...(response.data || []))
  }
  const details = await Promise.all(sales.map((sale) => request(`/ventas/${sale.id}`)))
  return sales.map((sale, index) => {
    const detail = details[index] || {}
    return {
      ...sale,
      cliente: sale.cliente || sale.cliente_nombre || detail.cliente?.nombre || detail.cliente_nombre || 'Cliente general',
      metodo_pago: sale.metodo_pago || detail.pagos?.[0]?.metodo || 'Sin pago',
      unidades: (detail.items || []).reduce((sum, item) => sum + Number(item.cantidad || 0), 0)
    }
  })
}

const buildMockReport = ({ desde, hasta }) => {
  const sales = ventasMock.filter((sale) => sale.estado === 'pagada' && toDate(sale.fecha) >= desde && toDate(sale.fecha) <= hasta)
  const byDay = []
  for (let cursor = formatDate(desde); cursor <= formatDate(hasta); cursor.setDate(cursor.getDate() + 1)) {
    const day = cursor.toISOString().slice(0, 10)
    const daily = sales.filter((sale) => toDate(sale.fecha) === day)
    byDay.push({ dia: day, ventas: daily.length, total: daily.reduce((sum, sale) => sum + Number(sale.total || 0), 0) })
  }
  const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  const methods = ['efectivo', 'yape', 'plin', 'tarjeta'].map((metodo) => ({
    metodo,
    operaciones: sales.filter((sale) => sale.metodo_pago === metodo).length,
    total: sales.filter((sale) => sale.metodo_pago === metodo).reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  })).filter((item) => item.operaciones)
  const detalleVentas = sales.map((sale) => {
    const detail = ventasDetalleMock[sale.id]
    return {
      ...sale,
      cliente: sale.cliente || 'Cliente general',
      unidades: detail?.items?.reduce((sum, item) => sum + Number(item.cantidad || 0), 0) || 0
    }
  })
  return {
    kpis: {
      ventasHoy: { monto: sales.filter((sale) => toDate(sale.fecha) === toDate(new Date().toISOString())).reduce((sum, sale) => sum + Number(sale.total || 0), 0), variacion: 0 },
      ventasPeriodo: { monto: total, comprobantes: sales.length },
      ticketPromedio: sales.length ? total / sales.length : 0,
      productosAlerta: productosMock.filter((product) => ['agotado', 'stock_bajo', 'por_vencer', 'vencido'].includes(product.estado)).length
    },
    ventasPorDia: byDay,
    metodosPago: methods,
    topProductos: [],
    alertasInventario: productosMock.filter((product) => ['agotado', 'stock_bajo', 'por_vencer', 'vencido'].includes(product.estado)).slice(0, 20),
    detalleVentas
  }
}

export const reportesService = {
  obtener: ({ desde, hasta }) => useMocks
    ? mockDelay(buildMockReport({ desde, hasta }))
    : Promise.all([
      request(`/reportes?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`),
      listarDetalleVentas({ desde, hasta })
    ]).then(([report, detalleVentas]) => ({ ...report, detalleVentas })),
  descargarCsv: async ({ desde, hasta }) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const response = await fetch(`${API_URL}/reportes/exportar.csv?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`, {
      headers: { Accept: 'text/csv', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    })
    if (!response.ok) throw new Error('No se pudo exportar el reporte CSV.')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-${desde}-${hasta}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
}
