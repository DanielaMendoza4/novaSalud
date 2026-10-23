import { useState } from 'react'

/**
 * Hook useAlertas: Manejo de alertas en tiempo real según Paso 10 de trabajoPlan.pdf
 */
export function useAlertas() {
  const [alertas, setAlertas] = useState([
    {
      id: 1,
      tipo: 'stock_bajo',
      titulo: 'Stock crítico: Paracetamol 500mg',
      descripcion: 'Quedan 3 unidades (mínimo requerido: 15)',
      tiempo: 'Hace 10 min',
      icono: '⚠️'
    },
    {
      id: 2,
      tipo: 'por_vencer',
      titulo: 'Por vencer: Amoxicilina 250mg',
      descripcion: 'Lote L-2024 vence en 18 días',
      tiempo: 'Hace 35 min',
      icono: '⏳'
    },
    {
      id: 3,
      tipo: 'agotado',
      titulo: 'Producto agotado: Ibuprofeno 400mg',
      descripcion: 'Stock en 0. Requiere reposición inmediata',
      tiempo: 'Hace 1 h',
      icono: '🚫'
    }
  ])
  const [nuevaAlerta, setNuevaAlerta] = useState(null)

  const agregarAlerta = (alerta) => {
    setAlertas((prev) => [alerta, ...prev])
    setNuevaAlerta(alerta)
  }

  const resolverAlerta = (id) => {
    setAlertas((prev) => prev.filter((a) => a.id !== id))
  }

  return {
    alertas,
    nuevaAlerta,
    agregarAlerta,
    resolverAlerta,
    setAlertas
  }
}

export default useAlertas
