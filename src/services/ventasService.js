import { request, mockDelay, useMocks } from './http'
import { ventasDetalleMock, ventasMock } from './mocks/ventasMocks'
import { productosMock } from './mocks/productosMocks'
import { ahoraEnLima } from '../utils/fechas'

let ventasMockActuales = ventasMock.map((venta) => ({ ...venta }))
const ventasDetalleMockActuales = { ...ventasDetalleMock }
let siguienteIdMock = Math.max(Date.now(), ...ventasMock.map((venta) => Number(venta.id) + 1))
const redondear = (value) => Number(value.toFixed(2))

export const ventasService = {
  listar: ({ estado = '', desde = '', hasta = '', page = 1, limit = 20 } = {}) => {
    if (useMocks) {
      const rol = JSON.parse(localStorage.getItem('novasalud_usuario') || 'null')?.rol
      const data = ventasMockActuales.filter((venta) =>
        (!estado || venta.estado === estado) &&
        (!desde || venta.fecha >= desde) &&
        (!hasta || venta.fecha <= `${hasta}T23:59:59`)
      ).map(({ usuario_nombre, ...venta }) => rol === 'admin' ? { ...venta, usuario_nombre } : venta)
      const start = (page - 1) * limit
      return mockDelay({ data: data.slice(start, start + limit), page, limit, total: data.length })
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (estado) params.set('estado', estado)
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    return request(`/ventas?${params}`)
  },
  obtener: (id) => useMocks
    ? mockDelay(ventasDetalleMockActuales[Number(id)] || null)
    : request(`/ventas/${id}`),
  crear: (venta) => {
    if (!useMocks) return request('/ventas', { method: 'POST', body: JSON.stringify(venta) })
    const items = venta.items.map((item) => {
      const product = productosMock.find((entry) => entry.id === item.producto_id)
      if (!product) throw new Error(`No se encontró el producto ${item.producto_id}.`)
      return {
        producto_id: item.producto_id,
        nombre: product.nombre,
        cantidad: item.cantidad,
        precio_unitario: product.precio,
        subtotal: redondear(product.precio * item.cantidad)
      }
    })
    const total = redondear(items.reduce((sum, item) => sum + item.subtotal, 0))
    const subtotal = redondear(total / 1.18)
    const pagos = venta.pagos || []
    const sale = {
      id: siguienteIdMock++,
      serie_numero: `${venta.comprobante === 'factura' ? 'F001' : 'B001'}-${String(siguienteIdMock - 1).slice(-4)}`,
      fecha: ahoraEnLima(),
      comprobante: venta.comprobante,
      estado: venta.estado,
      items,
      subtotal,
      igv: redondear(total - subtotal),
      total,
      pagos,
      vuelto: redondear(Math.max(0, pagos.filter((pago) => pago.metodo === 'efectivo').reduce((sum, pago) => sum + pago.monto, 0) - total))
    }
    ventasMockActuales = [sale, ...ventasMockActuales]
    ventasDetalleMockActuales[sale.id] = sale
    return mockDelay(sale)
  },
  cobrar: (id, pagos) => {
    if (!useMocks) return request(`/ventas/${id}/cobrar`, { method: 'PUT', body: JSON.stringify({ pagos }) })
    const sale = ventasDetalleMockActuales[Number(id)]
    if (!sale || sale.estado !== 'espera') throw new Error('La venta en espera ya no existe.')
    const updatedSale = {
      ...sale,
      estado: 'pagada',
      pagos,
      vuelto: redondear(Math.max(0, pagos.filter((pago) => pago.metodo === 'efectivo').reduce((sum, pago) => sum + pago.monto, 0) - sale.total))
    }
    ventasDetalleMockActuales[Number(id)] = updatedSale
    ventasMockActuales = ventasMockActuales.map((venta) => venta.id === Number(id)
      ? { ...venta, estado: 'pagada', metodo_pago: pagos[0]?.metodo }
      : venta)
    return mockDelay(updatedSale)
  },
  descartar: (id) => {
    if (!useMocks) return request(`/ventas/${id}`, { method: 'DELETE' })
    if (!ventasDetalleMockActuales[Number(id)] || !ventasMockActuales.some((venta) => venta.id === Number(id))) {
      throw new Error('La venta en espera ya no existe.')
    }
    ventasMockActuales = ventasMockActuales.filter((venta) => venta.id !== Number(id))
    delete ventasDetalleMockActuales[Number(id)]
    return mockDelay(null)
  },
  anular: (id) => useMocks ? mockDelay(null) : request(`/ventas/${id}/anular`, { method: 'PUT' })
}
