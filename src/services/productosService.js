import { request, mockDelay, useMocks } from './http'
import { productosMock } from './mocks/productosMocks'

export const productosService = {
  listar: ({ q = '', page = 1, limit = 50 } = {}) => {
    if (useMocks) {
      const query = q.trim().toLowerCase()
      const filtered = productosMock.filter((producto) => {
        if (!query) return true
        const matchString = [
          producto.nombre,
          producto.codigo,
          producto.principio_activo,
          producto.laboratorio,
          producto.categoria,
          producto.presentacion
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return matchString.includes(query)
      })
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
  crear: (producto) => {
    if (useMocks) {
      const nuevo = {
        ...producto,
        id: Date.now(),
        stock_total: Number(producto.stock_total || 0),
        stock_minimo: Number(producto.stock_minimo || 5),
        estado: producto.stock_total > 0 ? 'normal' : 'agotado',
        proximo_vencimiento: producto.proximo_vencimiento || null
      }
      productosMock.unshift(nuevo)
      return mockDelay(nuevo)
    }
    return request('/productos', { method: 'POST', body: JSON.stringify(producto) })
  },
  actualizar: (id, producto) => {
    if (useMocks) {
      const index = productosMock.findIndex((p) => p.id === Number(id))
      if (index !== -1) {
        const actualizado = {
          ...productosMock[index],
          ...producto,
          id: Number(id),
          precio: Number(producto.precio ?? productosMock[index].precio),
          precio_costo: Number(producto.precio_costo ?? productosMock[index].precio_costo),
          stock_minimo: Number(producto.stock_minimo ?? productosMock[index].stock_minimo)
        }
        productosMock[index] = actualizado
        return mockDelay(actualizado)
      }
      return mockDelay({ ...producto, id })
    }
    return request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(producto) })
  },
  eliminar: (id) => {
    if (useMocks) {
      const index = productosMock.findIndex((p) => p.id === Number(id))
      if (index !== -1) {
        productosMock.splice(index, 1)
      }
      return mockDelay({ success: true })
    }
    return request(`/productos/${id}`, { method: 'DELETE' })
  },
  reponer: (id, lote) => {
    if (useMocks) {
      const index = productosMock.findIndex((p) => p.id === Number(id))
      if (index !== -1) {
        productosMock[index].stock_total += Number(lote.cantidad || 0)
        if (productosMock[index].stock_total > productosMock[index].stock_minimo) {
          productosMock[index].estado = 'normal'
        }
      }
      return mockDelay({ producto_id: id, ...lote })
    }
    return request(`/productos/${id}/lotes`, { method: 'POST', body: JSON.stringify(lote) })
  }
}
