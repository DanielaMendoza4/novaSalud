import { request, mockDelay, useMocks } from './http'
import { clientesMock } from './mocks/clientesMocks'

export const clientesService = {
  listar: (q = '') => {
    if (useMocks) {
      const query = q.toLowerCase()
      return mockDelay(clientesMock.filter((cliente) =>
        `${cliente.nombre} ${cliente.numero_doc}`.toLowerCase().includes(query)
      ))
    }
    return request(`/clientes?q=${encodeURIComponent(q)}`)
  },
  crear: (cliente) => {
    if (useMocks) {
      const nuevo = { ...cliente, id: clientesMock.length + 1 }
      clientesMock.push(nuevo)
      return mockDelay(nuevo)
    }
    return request('/clientes', {
      method: 'POST',
      body: JSON.stringify(cliente)
    })
  }
}
