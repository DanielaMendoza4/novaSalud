import { useContext } from 'react'
import DatosContext from './DatosContext'

export function useDatos() {
  const context = useContext(DatosContext)
  if (!context) throw new Error('useDatos debe usarse dentro de DatosProvider.')
  return context
}

export function useDatosOpcionales() {
  return useContext(DatosContext)
}
