import { useState } from 'react'
import DatosContext from './DatosContext'
import { clientesIniciales } from '../data/clientes'
import { productosIniciales } from '../data/productos'
import { ventasIniciales } from '../data/ventas'

const alertasIniciales = [
  {
    id: 1,
    tipo: 'stock_bajo',
    titulo: 'Stock crítico: Paracetamol 500mg',
    descripcion: 'Quedan 3 unidades (mínimo requerido: 15)',
    tiempo: 'Hace 10 min',
  },
  {
    id: 2,
    tipo: 'por_vencer',
    titulo: 'Por vencer: Amoxicilina 250mg',
    descripcion: 'Lote L-2024 vence en 18 días',
    tiempo: 'Hace 35 min',
  },
  {
    id: 3,
    tipo: 'agotado',
    titulo: 'Producto agotado: Ibuprofeno 400mg',
    descripcion: 'Stock en 0. Requiere reposición inmediata',
    tiempo: 'Hace 1 h',
  }
]

export function DatosProvider({ children }) {
  const [productos, setProductos] = useState(productosIniciales)
  const [clientes, setClientes] = useState(clientesIniciales)
  const [ventas, setVentas] = useState(ventasIniciales)
  const [alertas, setAlertas] = useState(alertasIniciales)
  const [nuevaAlerta, setNuevaAlerta] = useState(null)

  const agregarAlerta = (alerta) => {
    const alertaCompleta = { ...alerta, id: `${Date.now()}-${Math.random()}`, tiempo: 'Ahora' }
    setAlertas((actuales) => [alertaCompleta, ...actuales])
    setNuevaAlerta(alertaCompleta)
  }

  const registrarVenta = (venta) => {
    const cantidades = new Map()
    venta.items.forEach((item) => {
      cantidades.set(item.productoId, (cantidades.get(item.productoId) || 0) + item.cantidad)
    })
    const inventarioSuficiente = [...cantidades].every(([productoId, cantidad]) => {
      const producto = productos.find((actual) => actual.id === productoId)
      return producto && Number.isInteger(cantidad) && cantidad > 0 && cantidad <= producto.stock
    })
    if (!inventarioSuficiente) return false

    setVentas((actuales) => [venta, ...actuales])
    const alertasGeneradas = []
    const actualizados = productos.map((producto) => {
      const cantidad = cantidades.get(producto.id)
      if (!cantidad) return producto
      const stock = producto.stock - cantidad
      if (stock <= producto.minimo) {
        alertasGeneradas.push({
          tipo: stock === 0 ? 'agotado' : 'stock_bajo',
          titulo: `${stock === 0 ? 'Producto agotado' : 'Stock bajo'}: ${producto.nombre}`,
          descripcion: `Quedan ${stock} unidades (mínimo requerido: ${producto.minimo})`,
        })
      }
      return {
        ...producto,
        stock,
        estado: stock === 0 ? 'agotado' : stock <= producto.minimo ? 'stock_bajo' : 'normal',
        estadoLabel: stock === 0 ? 'Agotado' : stock <= producto.minimo ? 'Stock bajo' : 'Normal'
      }
    })
    setProductos(actualizados)
    alertasGeneradas.forEach(agregarAlerta)
    return true
  }

  const anularVenta = (ventaId) => {
    const venta = ventas.find((actual) => actual.id === ventaId)
    if (!venta || venta.estado !== 'completada') return false
    setVentas((actuales) =>
      actuales.map((actual) =>
        actual.id === ventaId
          ? { ...actual, estado: 'anulada', anuladaEn: new Date().toISOString() }
          : actual
      )
    )
    setProductos((actuales) =>
      actuales.map((producto) => {
        const cantidad = venta.items
          .filter((item) => item.productoId === producto.id)
          .reduce((total, item) => total + item.cantidad, 0)
        if (!cantidad) return producto
        const stock = producto.stock + cantidad
        return {
          ...producto,
          stock,
          estado: stock === 0 ? 'agotado' : stock <= producto.minimo ? 'stock_bajo' : 'normal',
          estadoLabel: stock === 0 ? 'Agotado' : stock <= producto.minimo ? 'Stock bajo' : 'Normal'
        }
      })
    )
    return true
  }

  const resolverAlerta = (id) => {
    setAlertas((actuales) => actuales.filter((alerta) => alerta.id !== id))
  }

  return (
    <DatosContext.Provider
      value={{
        productos,
        setProductos,
        clientes,
        setClientes,
        ventas,
        registrarVenta,
        anularVenta,
        alertas,
        agregarAlerta,
        nuevaAlerta,
        setAlertas,
        resolverAlerta
      }}
    >
      {children}
    </DatosContext.Provider>
  )
}
