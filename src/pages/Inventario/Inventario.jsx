import { useState, useEffect, useMemo, useCallback } from 'react'
import Modal from '../../components/Modal/Modal'
import Toast from '../../components/Toast/Toast'
import { productosService } from '../../services/productosService'
import { mensajeDeError } from '../../utils/errores'
import './Inventario.css'

// Helper puro para formatear la fecha y tiempo relativo de vencimiento
function formatVencimiento(p) {
  if (!p.proximo_vencimiento) {
    return { fecha: '—', relativo: null, esVencido: false }
  }
  const partes = p.proximo_vencimiento.split('-')
  const fechaFormateada =
    partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : p.proximo_vencimiento

  if (p.dias_vencimiento !== undefined && p.dias_vencimiento !== null) {
    if (p.dias_vencimiento < 0) {
      return {
        fecha: fechaFormateada,
        relativo: `Vencido hace ${Math.abs(p.dias_vencimiento)} días`,
        esVencido: true
      }
    }
    return {
      fecha: fechaFormateada,
      relativo: `En ${p.dias_vencimiento} días`,
      esVencido: false
    }
  }

  const fechaTarget = new Date(p.proximo_vencimiento).getTime()
  const diffDias = Math.round((fechaTarget - Date.now()) / (1000 * 60 * 60 * 24))
  if (diffDias < 0) {
    return {
      fecha: fechaFormateada,
      relativo: `Vencido hace ${Math.abs(diffDias)} días`,
      esVencido: true
    }
  }
  return {
    fecha: fechaFormateada,
    relativo: `En ${diffDias} días`,
    esVencido: false
  }
}

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  // Banner informativo superior
  const [alertaBanner, setAlertaBanner] = useState('Se agregaron 50 unidades de Amoxicilina 500mg (lote L2510).')

  // Modales y notificaciones
  const [productoAEditar, setProductoAEditar] = useState(null)
  const [productoAEliminar, setProductoAEliminar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)

  // Carga inicial de datos
  const cargarProductos = useCallback(async () => {
    setCargando(true)
    try {
      const res = await productosService.listar({ limit: 100 })
      setProductos(res.data || [])
      setError('')
    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarProductos()
  }, [cargarProductos])

  // Categorías únicas detectadas dinámicamente
  const categorias = useMemo(() => {
    const set = new Set()
    productos.forEach((p) => {
      if (p.categoria) set.add(p.categoria)
    })
    return Array.from(set)
  }, [productos])

  // Métricas calculadas para las 4 KPI cards
  const metricas = useMemo(() => {
    const totalRegistrados = productos.length
    const totalCategorias = categorias.length

    const stockBajo = productos.filter((p) => p.estado === 'stock_bajo').length
    const agotados = productos.filter((p) => p.estado === 'agotado' || p.stock_total === 0).length

    const porVencer = productos.filter((p) => p.estado === 'por_vencer').length
    const vencidos = productos.filter((p) => p.estado === 'vencido').length

    // Valor del inventario a precio de costo
    const valorInventario = productos.reduce((acc, p) => {
      const costo = Number(p.precio_costo ?? p.precio ?? 0)
      const stock = Number(p.stock_total ?? 0)
      return acc + costo * stock
    }, 0)

    return {
      totalRegistrados,
      totalCategorias,
      stockBajo,
      agotados,
      porVencer,
      vencidos,
      valorInventario
    }
  }, [productos, categorias])

  // Filtrado de la lista
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // Filtro de texto
      if (busqueda.trim()) {
        const query = busqueda.trim().toLowerCase()
        const matchString = [
          p.nombre,
          p.codigo,
          p.principio_activo,
          p.laboratorio,
          p.categoria,
          p.presentacion
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!matchString.includes(query)) return false
      }

      // Filtro por estado
      if (filtroEstado !== 'todos') {
        if (p.estado !== filtroEstado) return false
      }

      // Filtro por categoría
      if (filtroCategoria !== 'todas') {
        if (p.categoria !== filtroCategoria) return false
      }

      return true
    })
  }, [productos, busqueda, filtroEstado, filtroCategoria])

  // Manejo de edición
  const handleAbrirEditar = (producto) => {
    setProductoAEditar({ ...producto })
  }

  const handleGuardarEdicion = async (e) => {
    e.preventDefault()
    if (!productoAEditar) return
    setGuardando(true)
    try {
      await productosService.actualizar(productoAEditar.id, productoAEditar)
      setProductos((actuales) =>
        actuales.map((p) => (p.id === productoAEditar.id ? { ...productoAEditar } : p))
      )
      setToast({
        type: 'success',
        title: 'Actualización exitosa',
        message: `El producto "${productoAEditar.nombre}" ha sido modificado correctamente.`
      })
      setProductoAEditar(null)
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Error al actualizar',
        message: mensajeDeError(err)
      })
    } finally {
      setGuardando(false)
    }
  }

  // Manejo de eliminación
  const handleAbrirEliminar = (producto) => {
    setProductoAEliminar(producto)
  }

  const handleConfirmarEliminacion = async () => {
    if (!productoAEliminar) return
    setGuardando(true)
    try {
      await productosService.eliminar(productoAEliminar.id)
      setProductos((actuales) => actuales.filter((p) => p.id !== productoAEliminar.id))
      setToast({
        type: 'success',
        title: 'Producto eliminado',
        message: `Se ha retirado "${productoAEliminar.nombre}" del inventario.`
      })
      setProductoAEliminar(null)
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Error al eliminar',
        message: mensajeDeError(err)
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="inventario-view">
      {/* Toast de notificaciones flotantes */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Encabezado: Título y subtítulo (Botón '+ Nuevo producto' omitido por indicación de tachado en rojo) */}
      <div className="inventario-header-block">
        <div className="inventario-title-area">
          <h1 className="inventario-title">Gestión de inventario</h1>
          <p className="inventario-subtitle">Productos, lotes y vencimientos de la botica.</p>
        </div>
      </div>

      {/* Banner de alerta verde informativo */}
      {alertaBanner && (
        <div className="inventario-alert-banner">
          <span className="inventario-alert-text">{alertaBanner}</span>
          <button
            type="button"
            className="inventario-alert-close"
            onClick={() => setAlertaBanner(null)}
            title="Cerrar aviso"
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}

      {/* Tarjetas KPI de resumen estadístico */}
      <div className="inventario-kpi-grid">
        <div className="inventario-kpi-card accent-teal">
          <span className="kpi-label">Productos registrados</span>
          <strong className="kpi-value">{metricas.totalRegistrados}</strong>
          <span className="kpi-sub">{metricas.totalCategorias} categorías</span>
        </div>

        <div className="inventario-kpi-card accent-orange">
          <span className="kpi-label">Stock bajo</span>
          <strong className="kpi-value">{metricas.stockBajo}</strong>
          <span className="kpi-sub">{metricas.agotados} agotados</span>
        </div>

        <div className="inventario-kpi-card accent-red">
          <span className="kpi-label">Por vencer (30 días)</span>
          <strong className="kpi-value">{metricas.porVencer}</strong>
          <span className="kpi-sub">{metricas.vencidos} vencidos por retirar</span>
        </div>

        <div className="inventario-kpi-card accent-blue">
          <span className="kpi-label">Valor del inventario</span>
          <strong className="kpi-value">S/ {metricas.valorInventario.toFixed(2)}</strong>
          <span className="kpi-sub">A precio de costo</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="inventario-filters-card">
        <div className="inventario-search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="inventario-search-input"
            placeholder="Buscar por nombre, código, principio activo o laboratorio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="pos-badge">LECTOR POS</span>
        </div>

        <div className="inventario-select-group">
          <select
            className="inventario-filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="normal">Normal</option>
            <option value="stock_bajo">Stock bajo</option>
            <option value="por_vencer">Por vencer</option>
            <option value="agotado">Agotado</option>
            <option value="vencido">Vencido</option>
          </select>

          <select
            className="inventario-filter-select"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla Principal de Inventario */}
      <div className="inventario-table-card">
        {error && <div className="inventario-error-message">{error}</div>}

        <div className="inventario-table-wrapper">
          <table className="inventario-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>CÓDIGO</th>
                <th style={{ width: '280px' }}>PRODUCTO</th>
                <th style={{ width: '140px' }}>STOCK</th>
                <th style={{ width: '150px' }}>PRÓX. VENCIMIENTO</th>
                <th style={{ width: '100px' }}>PRECIO</th>
                <th style={{ width: '130px' }}>ESTADO</th>
                {/* NOTA: Las acciones 'Reponer' y 'Lotes' fueron tachadas en rojo en la referencia,
                    por lo que solo se conservan las acciones operativas: 'Editar' y 'Eliminar'. */}
                <th style={{ width: '140px', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="7" className="table-loading-cell">
                    Cargando inventario...
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty-cell">
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((item) => {
                  const vencimiento = formatVencimiento(item)

                  // Cálculo de la barra de nivel de stock
                  let stockPercent = 0
                  if (item.stock_total > 0) {
                    const ratio = item.stock_total / (item.stock_minimo * 2 || 20)
                    stockPercent = Math.min(100, Math.max(15, Math.round(ratio * 100)))
                  }

                  let barColorClass = 'bar-green'
                  if (item.estado === 'stock_bajo') barColorClass = 'bar-yellow'
                  else if (item.estado === 'vencido') barColorClass = 'bar-orange'
                  else if (item.estado === 'agotado' || item.stock_total === 0) barColorClass = 'bar-empty'

                  return (
                    <tr key={item.id || item.codigo}>
                      {/* CÓDIGO */}
                      <td className="col-codigo">{item.codigo}</td>

                      {/* PRODUCTO */}
                      <td className="col-producto">
                        <div className="producto-nombre">{item.nombre}</div>
                        <div className="producto-detalles">
                          {[item.presentacion, item.principio_activo, item.laboratorio]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                        <div className="producto-tags">
                          {item.categoria && <span className="tag-pill tag-categoria">{item.categoria}</span>}
                          {item.requiere_receta && <span className="tag-pill tag-receta">Receta</span>}
                          {item.refrigerado && (
                            <span className="tag-pill tag-refrigerado">Refrigerado (2-8 °C)</span>
                          )}
                        </div>
                      </td>

                      {/* STOCK */}
                      <td className="col-stock">
                        <div className="stock-number">
                          <strong>{item.stock_total}</strong>
                          <span className="stock-min"> / min. {item.stock_minimo}</span>
                        </div>
                        <div className="stock-progress-track">
                          <div
                            className={`stock-progress-fill ${barColorClass}`}
                            style={{ width: `${item.stock_total === 0 ? 0 : stockPercent}%` }}
                          />
                        </div>
                      </td>

                      {/* PRÓX. VENCIMIENTO */}
                      <td className="col-vencimiento">
                        <div className="vencimiento-fecha">{vencimiento.fecha}</div>
                        {vencimiento.relativo && (
                          <div
                            className={`vencimiento-relativo ${
                              vencimiento.esVencido ? 'texto-vencido' : ''
                            }`}
                          >
                            {vencimiento.relativo}
                          </div>
                        )}
                      </td>

                      {/* PRECIO */}
                      <td className="col-precio">S/ {Number(item.precio || 0).toFixed(2)}</td>

                      {/* ESTADO */}
                      <td className="col-estado">
                        {item.estado === 'stock_bajo' && (
                          <span className="status-badge badge-stock-bajo">
                            <span className="status-dot dot-yellow" /> Stock bajo
                          </span>
                        )}
                        {item.estado === 'por_vencer' && (
                          <span className="status-badge badge-por-vencer">
                            <span className="status-dot dot-orange" /> Por vencer
                          </span>
                        )}
                        {item.estado === 'agotado' && (
                          <span className="status-badge badge-agotado">
                            <span className="status-dot dot-red" /> Agotado
                          </span>
                        )}
                        {item.estado === 'normal' && (
                          <span className="status-badge badge-normal">
                            <span className="status-dot dot-green" /> Normal
                          </span>
                        )}
                        {item.estado === 'vencido' && (
                          <span className="status-badge badge-vencido">
                            <span className="status-dot dot-red" /> Vencido
                          </span>
                        )}
                      </td>

                      {/* ACCIONES (Exclusivamente Editar y Eliminar) */}
                      <td className="col-acciones">
                        <button
                          type="button"
                          className="btn-action btn-edit"
                          onClick={() => handleAbrirEditar(item)}
                          title="Editar producto"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-delete"
                          onClick={() => handleAbrirEliminar(item)}
                          title="Eliminar producto"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla con conteo de registros */}
        <div className="inventario-table-footer">
          <span>
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </span>
        </div>
      </div>

      {/* Modal para Editar Producto */}
      {productoAEditar && (
        <Modal
          isOpen={Boolean(productoAEditar)}
          onClose={() => setProductoAEditar(null)}
          title={`Editar producto: ${productoAEditar.codigo}`}
          size="md"
        >
          <form onSubmit={handleGuardarEdicion} className="inventario-modal-form">
            <div className="form-group-grid">
              <div className="form-field full-width">
                <label htmlFor="edit-nombre">Nombre comercial del producto</label>
                <input
                  id="edit-nombre"
                  type="text"
                  required
                  value={productoAEditar.nombre || ''}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, nombre: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-codigo">Código</label>
                <input
                  id="edit-codigo"
                  type="text"
                  required
                  value={productoAEditar.codigo || ''}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, codigo: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-presentacion">Presentación</label>
                <input
                  id="edit-presentacion"
                  type="text"
                  placeholder="Ej: Tab x100, Caps x20"
                  value={productoAEditar.presentacion || ''}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, presentacion: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-principio">Principio activo</label>
                <input
                  id="edit-principio"
                  type="text"
                  value={productoAEditar.principio_activo || ''}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, principio_activo: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-laboratorio">Laboratorio</label>
                <input
                  id="edit-laboratorio"
                  type="text"
                  value={productoAEditar.laboratorio || ''}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, laboratorio: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-categoria">Categoría</label>
                <input
                  id="edit-categoria"
                  type="text"
                  value={productoAEditar.categoria || ''}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, categoria: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-precio">Precio venta (S/)</label>
                <input
                  id="edit-precio"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={productoAEditar.precio ?? ''}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, precio: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-costo">Precio costo (S/)</label>
                <input
                  id="edit-costo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productoAEditar.precio_costo ?? ''}
                  onChange={(e) =>
                    setProductoAEditar({
                      ...productoAEditar,
                      precio_costo: parseFloat(e.target.value) || 0
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-minimo">Stock mínimo</label>
                <input
                  id="edit-minimo"
                  type="number"
                  min="1"
                  required
                  value={productoAEditar.stock_minimo ?? ''}
                  onChange={(e) =>
                    setProductoAEditar({
                      ...productoAEditar,
                      stock_minimo: parseInt(e.target.value, 10) || 0
                    })
                  }
                />
              </div>
            </div>

            <div className="form-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(productoAEditar.requiere_receta)}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, requiere_receta: e.target.checked })
                  }
                />
                <span>Requiere receta médica</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Boolean(productoAEditar.refrigerado)}
                  onChange={(e) =>
                    setProductoAEditar({ ...productoAEditar, refrigerado: e.target.checked })
                  }
                />
                <span>Requiere refrigeración (2-8 °C)</span>
              </label>
            </div>

            <div className="modal-buttons-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setProductoAEditar(null)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-modal-submit"
                disabled={guardando}
              >
                {guardando ? 'Guardando cambios...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal para Confirmar Eliminación */}
      {productoAEliminar && (
        <Modal
          isOpen={Boolean(productoAEliminar)}
          onClose={() => setProductoAEliminar(null)}
          title="Confirmar eliminación"
          size="sm"
        >
          <div className="inventario-delete-modal-content">
            <p>
              ¿Estás seguro de que deseas eliminar permanentemente el producto{' '}
              <strong>{productoAEliminar.nombre}</strong> (código: <em>{productoAEliminar.codigo}</em>)?
            </p>
            <p className="delete-warning-text">
              Esta acción no se puede deshacer y el producto ya no estará disponible para ventas ni reportes.
            </p>

            <div className="modal-buttons-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setProductoAEliminar(null)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleConfirmarEliminacion}
                disabled={guardando}
              >
                {guardando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
