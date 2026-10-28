import { request, mockDelay, useMocks } from './http'
import { productosMock } from './mocks/productosMocks'

export const productosService = {
  listar: ({ q = '', page = 1, limit = 20 } = {}) => {
    if (useMocks) {
      const query = q.toLowerCase()
      const filtered = productosMock.filter((producto) =>
        `${producto.nombre} ${producto.codigo}`.toLowerCase().includes(query)
      )
      const start = (page - 1) * limit
      return mockDelay({
        data: filtered.slice(start, start + limit),
        page,
        limit,
        total: filtered.length
      })
    }
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (q) params.set('q', q)
    return request(`/productos?${params}`)
  },
  crear: (producto) => useMocks
    ? mockDelay({ ...producto, id: Date.now(), stock_total: 0, estado: 'agotado', proximo_vencimiento: null })
    : request('/productos', { method: 'POST', body: JSON.stringify(producto) }),
  actualizar: (id, producto) => useMocks
    ? mockDelay({ ...producto, id })
    : request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(producto) }),
  eliminar: (id) => useMocks ? mockDelay(null) : request(`/productos/${id}`, { method: 'DELETE' }),
  reponer: (id, lote) => useMocks
    ? mockDelay({ producto_id: id, ...lote })
    : request(`/productos/${id}/lotes`, { method: 'POST', body: JSON.stringify(lote) })
}
