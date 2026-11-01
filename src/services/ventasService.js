import { ApiError, request, mockDelay, useMocks } from './http'
import { ventasDetalleMock, ventasMock } from './mocks/ventasMocks'
import { productosMock } from './mocks/productosMocks'
import { ahoraEnLima } from '../utils/fechas'

const consumirStock = (items) => {
  const cantidades = new Map()
  items.forEach((item) => {
    const productoId = Number(item.producto_id)
    cantidades.set(productoId, (cantidades.get(productoId) || 0) + Number(item.cantidad))
  })

  const hayStock = [...cantidades].every(([productoId, cantidad]) => {
    const producto = productosMock.find((actual) => actual.id === productoId)
    return producto && Number.isInteger(cantidad) && cantidad > 0 && producto.stock_total >= cantidad
  })
  if (!hayStock) {
    throw new ApiError({
      codigo: 'STOCK_INSUFICIENTE',
      mensaje: 'El stock disponible no alcanza para completar la venta.',
      status: 409
    })
  }

  cantidades.forEach((cantidad, productoId) => {
    const producto = productosMock.find((actual) => actual.id === productoId)
    producto.stock_total -= cantidad
    if (producto.stock_total === 0) producto.estado = 'agotado'
    else if (producto.stock_total <= producto.stock_minimo) producto.estado = 'stock_bajo'
    else if (!['por_vencer', 'vencido'].includes(producto.estado)) producto.estado = 'normal'
  })
}

export const ventasService = {
  listar: ({ estado = '', desde = '', hasta = '', page = 1, limit = 20 } = {}) => {
    if (useMocks) {
      const rol = JSON.parse(localStorage.getItem('novasalud_usuario') || 'null')?.rol
      const data = ventasMock.filter((venta) =>
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
    ? mockDelay(ventasDetalleMock[Number(id)] || null)
    : request(`/ventas/${id}`),
  crear: (venta) => {
    if (useMocks) {
      const id = Date.now()
      if (venta.estado === 'pagada') consumirStock(venta.items)
      const nuevaVenta = {
        id,
        serie_numero: 'B001-DEMO',
        fecha: ahoraEnLima(),
        comprobante: venta.comprobante,
        estado: venta.estado,
        items: venta.items,
        subtotal: 0,
        igv: 0,
        total: venta.total || 0,
        pagos: venta.pagos || [],
        vuelto: 0
      }
      ventasMock.unshift(nuevaVenta)
      return mockDelay(nuevaVenta)
    }
    return request('/ventas', { method: 'POST', body: JSON.stringify(venta) })
  },
  cobrar: (id, pagos) => {
    if (useMocks) {
      const venta = ventasMock.find((actual) => actual.id === Number(id))
      if (venta?.estado === 'espera') consumirStock(venta.items)
      const actualizada = venta ? { ...venta, id: Number(id), estado: 'pagada', pagos, vuelto: 0 } : { id: Number(id), estado: 'pagada', pagos, vuelto: 0 }
      if (venta) Object.assign(venta, actualizada)
      return mockDelay(actualizada)
    }
    return request(`/ventas/${id}/cobrar`, { method: 'PUT', body: JSON.stringify({ pagos }) })
  },
  descartar: (id) => useMocks ? mockDelay(null) : request(`/ventas/${id}`, { method: 'DELETE' }),
  anular: (id) => useMocks ? mockDelay(null) : request(`/ventas/${id}/anular`, { method: 'PUT' })
}
