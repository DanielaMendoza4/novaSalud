import { request, mockDelay, useMocks } from './http'
import { ventasDetalleMock, ventasMock } from './mocks/ventasMocks'
import { ahoraEnLima } from '../utils/fechas'

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
  crear: (venta) => useMocks
    ? mockDelay({
      id: Date.now(),
      serie_numero: 'B001-DEMO',
      fecha: ahoraEnLima(),
      comprobante: venta.comprobante,
      estado: venta.estado,
      items: venta.items.map((item) => ({ ...item, nombre: 'Producto demo', precio_unitario: 0, subtotal: 0 })),
      subtotal: 0,
      igv: 0,
      total: 0,
      pagos: venta.pagos || [],
      vuelto: 0
    })
    : request('/ventas', { method: 'POST', body: JSON.stringify(venta) }),
  cobrar: (id, pagos) => useMocks
    ? mockDelay({ ...(ventasMock.find((venta) => venta.id === Number(id)) || {}), id: Number(id), estado: 'pagada', pagos, vuelto: 0 })
    : request(`/ventas/${id}/cobrar`, { method: 'PUT', body: JSON.stringify({ pagos }) }),
  descartar: (id) => useMocks ? mockDelay(null) : request(`/ventas/${id}`, { method: 'DELETE' }),
  anular: (id) => useMocks ? mockDelay(null) : request(`/ventas/${id}/anular`, { method: 'PUT' })
}
