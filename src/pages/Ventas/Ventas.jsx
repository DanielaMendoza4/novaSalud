import { useEffect, useMemo, useRef, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import Button from '../../components/Button/Button'
import Modal from '../../components/Modal/Modal'
import Table from '../../components/Table/Table'
import Toast from '../../components/Toast/Toast'
import { useAuth } from '../../context'
import { useDatos } from '../../context/useDatos'
import './Ventas.css'

const redondear = (importe) => Math.round((importe + Number.EPSILON) * 100) / 100
const moneda = (importe) => `S/ ${importe.toFixed(2)}`
const normalizar = (texto) => texto.toLocaleLowerCase('es-PE').trim()
const crearMarcaTemporalVenta = () => {
  const ahora = new Date()
  return {
    id: `V-${ahora.getFullYear()}-${ahora.getTime().toString().slice(-6)}`,
    fecha: ahora.toISOString()
  }
}
const fechaLocal = () => {
  const fecha = new Date()
  return new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

export default function Ventas() {
  const { usuario } = useAuth()
  const { productos, clientes, ventas, registrarVenta, anularVenta } = useDatos()
  const esAdmin = usuario?.rol === 'admin'
  const [pestana, setPestana] = useState('nueva')
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [carrito, setCarrito] = useState([])
  const [clienteId, setClienteId] = useState(1)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [mostrarClientes, setMostrarClientes] = useState(false)
  const [comprobante, setComprobante] = useState('boleta')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [ventaAnular, setVentaAnular] = useState(null)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const busquedaRef = useRef(null)

  const subtotal = redondear(carrito.reduce((importe, item) => importe + item.precio * item.cantidad, 0))
  const igv = redondear(subtotal * 0.18)
  const total = redondear(subtotal + igv)
  const clienteSeleccionado = clientes.find((cliente) => cliente.id === clienteId) || clientes[0]
  const coincidenciasProducto = useMemo(() => {
    const termino = normalizar(busquedaProducto)
    if (!termino) return []
    return productos.filter((producto) =>
      normalizar(`${producto.nombre} ${producto.codigo}`).includes(termino)
    ).slice(0, 5)
  }, [busquedaProducto, productos])

  useEffect(() => {
    const onKeyDown = (evento) => {
      if (evento.key === 'F2' && pestana === 'nueva') {
        evento.preventDefault()
        busquedaRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pestana])

  const avisar = (message, type = 'error', title = type === 'error' ? 'No se pudo completar' : 'Atención') => {
    setToast({ message, type, title })
  }

  const productoVencido = (producto) => producto.fechaVencimiento < fechaLocal()
  const estadoProducto = (producto) => {
    if (productoVencido(producto)) return { texto: 'Vencido', variante: 'danger' }
    const dias = Math.ceil((new Date(`${producto.fechaVencimiento}T00:00:00`) - new Date(`${fechaLocal()}T00:00:00`)) / 86400000)
    if (dias <= 30) return { texto: `Vence en ${dias} días`, variante: 'warning' }
    if (!producto.stock) return { texto: 'Agotado', variante: 'danger' }
    if (producto.stock <= producto.minimo) return { texto: 'Stock bajo', variante: 'warning' }
    return { texto: 'Disponible', variante: 'success' }
  }

  const agregarProducto = (producto) => {
    if (!producto) {
      avisar('No se encontró un producto con ese nombre o código.')
      return
    }
    if (productoVencido(producto)) {
      avisar(`${producto.nombre} está vencido y no puede venderse.`)
      return
    }
    const existente = carrito.find((item) => item.productoId === producto.id)
    const cantidadActual = existente?.cantidad || 0
    if (producto.stock <= cantidadActual) {
      avisar(producto.stock === 0 ? 'El producto está agotado.' : 'La cantidad supera el stock disponible.')
      return
    }
    setCarrito((actual) => {
      const actualExistente = actual.find((item) => item.productoId === producto.id)
      if (actualExistente) {
        return actual.map((item) =>
          item.productoId === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [...actual, {
        productoId: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        requiereReceta: producto.requiereReceta,
        recetaVerificada: false
      }]
    })
    setBusquedaProducto('')
  }

  const cambiarCantidad = (productoId, valor) => {
    const cantidad = Number(valor)
    const producto = productos.find((actual) => actual.id === productoId)
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      avisar('La cantidad debe ser un número entero mayor que cero.')
      return
    }
    if (cantidad > producto.stock) {
      avisar(`Solo hay ${producto.stock} unidades disponibles.`)
      return
    }
    setCarrito((actual) => actual.map((item) =>
      item.productoId === productoId ? { ...item, cantidad } : item
    ))
  }

  const actualizarUnidad = (productoId, cambio) => {
    const linea = carrito.find((item) => item.productoId === productoId)
    cambiarCantidad(productoId, linea.cantidad + cambio)
  }

  const limpiarVenta = () => {
    setCarrito([])
    setClienteId(1)
    setBusquedaCliente('')
    setComprobante('boleta')
    setMetodoPago('efectivo')
    setMontoRecibido('')
  }

  const cancelarVenta = () => {
    if (!carrito.length) {
      limpiarVenta()
      return
    }
    setModal({ tipo: 'cancelar' })
  }

  const cobrar = () => {
    if (!['admin', 'vendedor'].includes(usuario?.rol)) {
      avisar('Tu rol no tiene permiso para registrar ventas.')
      return
    }
    if (!carrito.length) return
    if (carrito.some((item) => item.requiereReceta && !item.recetaVerificada)) {
      avisar('Verifica la receta de cada medicamento que la requiere.')
      return
    }
    if (comprobante === 'factura' && !/^\d{11}$/.test(clienteSeleccionado?.documento || '')) {
      avisar('Para emitir una factura, selecciona un cliente con RUC de 11 dígitos.')
      return
    }
    const recibido = metodoPago === 'efectivo' ? Number(montoRecibido) : total
    if (metodoPago === 'efectivo' && (!Number.isFinite(recibido) || recibido < total)) {
      avisar('El monto recibido no cubre el total de la venta.')
      return
    }
    const nuevaVenta = {
      ...crearMarcaTemporalVenta(),
      clienteId: clienteSeleccionado.id,
      clienteNombre: clienteSeleccionado.nombre,
      clienteDocumento: clienteSeleccionado.documento,
      trabajadorId: usuario.id,
      trabajador: usuario.nombre,
      metodoPago,
      tipoComprobante: comprobante,
      estado: 'completada',
      subtotal,
      igv,
      total,
      recibido,
      vuelto: Math.max(recibido - total, 0),
      items: carrito.map(({ productoId, codigo, nombre, cantidad, precio }) => ({
        productoId, codigo, nombre, cantidad, precio
      }))
    }
    if (!registrarVenta(nuevaVenta)) {
      avisar('El stock cambió y ya no alcanza para completar la venta. Revisa el carrito.')
      return
    }
    setVentaSeleccionada(nuevaVenta)
    setModal({ tipo: 'comprobante' })
    limpiarVenta()
    avisar('La venta se registró correctamente.', 'success', 'Venta completada')
  }

  const ventasVisibles = ventas.filter((venta) => {
    if (!esAdmin && venta.trabajadorId !== usuario.id) return false
    const fecha = venta.fecha.slice(0, 10)
    return (!fechaDesde || fecha >= fechaDesde) && (!fechaHasta || fecha <= fechaHasta)
  })

  const confirmarAnulacion = () => {
    if (usuario?.rol !== 'admin') {
      avisar('Solo el administrador puede anular ventas.')
      setVentaAnular(null)
      return
    }
    if (anularVenta(ventaAnular?.id)) {
      avisar('La venta fue anulada y el stock fue restituido.', 'success', 'Venta anulada')
    }
    setVentaAnular(null)
  }

  const columnasHistorial = [
    { header: 'N° de venta', key: 'id', render: (id) => <strong>{id}</strong> },
    { header: 'Fecha', key: 'fecha', render: (fecha) => new Date(fecha).toLocaleString('es-PE') },
    { header: 'Cliente', key: 'clienteNombre' },
    { header: 'Trabajador', key: 'trabajador' },
    { header: 'Método', key: 'metodoPago', render: (metodo) => metodo.toUpperCase() },
    { header: 'Total', key: 'total', render: (importe) => <strong>{moneda(importe)}</strong> },
    {
      header: 'Estado',
      key: 'estado',
      render: (estado) => <Badge variant={estado === 'completada' ? 'success' : 'neutral'}>{estado}</Badge>
    },
    {
      header: 'Acciones',
      key: 'acciones',
      render: (_, venta) => (
        <div className="novasalud-ventas-acciones">
          <button type="button" className="novasalud-ventas-enlace" onClick={() => setVentaSeleccionada(venta)}>
            Ver detalle
          </button>
          {esAdmin && venta.estado === 'completada' && (
            <button type="button" className="novasalud-ventas-enlace peligro" onClick={() => setVentaAnular(venta)}
              aria-label={`Anular venta ${venta.id}`}>
              Anular
            </button>
          )}
        </div>
      )
    }
  ]

  const seleccionarCliente = (cliente) => {
    setClienteId(cliente.id)
    setBusquedaCliente(cliente.nombre)
    setMostrarClientes(false)
  }

  return (
    <section className="novasalud-ventas">
      {toast && <div className="novasalud-ventas-toast"><Toast {...toast} onClose={() => setToast(null)} /></div>}
      <header className="novasalud-ventas-encabezado">
        <div>
          <p className="novasalud-ventas-eyebrow">OPERACIONES</p>
          <h1>Ventas</h1>
          <p>Registra ventas, controla el stock y consulta el historial.</p>
        </div>
        <Badge variant="primary">Punto de venta</Badge>
      </header>

      <nav className="novasalud-ventas-pestanas" aria-label="Secciones de ventas">
        <button type="button" className={pestana === 'nueva' ? 'activa' : ''} onClick={() => setPestana('nueva')}>Nueva venta</button>
        <button type="button" className={pestana === 'historial' ? 'activa' : ''} onClick={() => setPestana('historial')}>Historial</button>
      </nav>

      {pestana === 'nueva' ? (
        <div className="novasalud-ventas-contenido">
          <div className="novasalud-ventas-busqueda">
            <section className="novasalud-ventas-panel">
              <div className="novasalud-ventas-titulo-panel">
                <div><h2>Agregar productos</h2><p>Busca por nombre o código. Pulsa Enter para agregar.</p></div>
                <span className="novasalud-ventas-atajo">F2</span>
              </div>
              <label className="novasalud-ventas-label" htmlFor="novasalud-busqueda-producto">Producto</label>
              <input id="novasalud-busqueda-producto" ref={busquedaRef} className="novasalud-ventas-input"
                value={busquedaProducto} onChange={(evento) => setBusquedaProducto(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter') {
                    evento.preventDefault()
                    const coincidencia = productos.find((producto) =>
                      normalizar(producto.codigo) === normalizar(busquedaProducto) ||
                      normalizar(producto.nombre) === normalizar(busquedaProducto)
                    ) || coincidenciasProducto[0]
                    agregarProducto(coincidencia)
                  }
                }} placeholder="Ej. MED-001 o Paracetamol" autoComplete="off" />
              {busquedaProducto && (
                <div className="novasalud-ventas-resultados">
                  {coincidenciasProducto.length ? coincidenciasProducto.map((producto) => {
                    const estado = estadoProducto(producto)
                    const bloqueado = productoVencido(producto) || producto.stock === 0
                    return (
                      <button key={producto.id} type="button" disabled={bloqueado}
                        className="novasalud-ventas-resultado" onClick={() => agregarProducto(producto)}>
                        <span><strong>{producto.nombre}</strong><small>{producto.codigo} · Stock: {producto.stock}</small></span>
                        <span className="novasalud-ventas-resultado-derecha"><strong>{moneda(producto.precio)}</strong><Badge variant={estado.variante} size="sm">{estado.texto}</Badge></span>
                      </button>
                    )
                  }) : <p className="novasalud-ventas-sin-resultados">No hay productos que coincidan.</p>}
                </div>
              )}
              <div className="novasalud-ventas-tip">Los productos vencidos o agotados no se pueden agregar.</div>
            </section>

            <section className="novasalud-ventas-panel">
              <div className="novasalud-ventas-titulo-panel"><div><h2>Cliente y comprobante</h2><p>Selecciona cliente y tipo de comprobante.</p></div></div>
              <label className="novasalud-ventas-label" htmlFor="novasalud-cliente">Cliente</label>
              <div className="novasalud-ventas-cliente-selector">
                <input id="novasalud-cliente" className="novasalud-ventas-input"
                  value={mostrarClientes ? busquedaCliente : (busquedaCliente || clienteSeleccionado?.nombre || '')}
                  onFocus={() => { setMostrarClientes(true); setBusquedaCliente('') }}
                  onChange={(evento) => { setBusquedaCliente(evento.target.value); setMostrarClientes(true) }}
                  placeholder="Nombre o documento" autoComplete="off" />
                {mostrarClientes && (
                  <div className="novasalud-ventas-clientes-opciones">
                    {clientes.filter((cliente) => cliente.estado === 'activo' &&
                      normalizar(`${cliente.nombre} ${cliente.documento}`).includes(normalizar(busquedaCliente)))
                      .slice(0, 6).map((cliente) => (
                        <button key={cliente.id} type="button" onClick={() => seleccionarCliente(cliente)}>
                          <span>{cliente.nombre}</span><small>{cliente.documento}</small>
                        </button>
                      ))}
                    {!clientes.some((cliente) => cliente.estado === 'activo' &&
                      normalizar(`${cliente.nombre} ${cliente.documento}`).includes(normalizar(busquedaCliente))) &&
                      <p>No se encontraron clientes activos.</p>}
                  </div>
                )}
              </div>
              <div className="novasalud-ventas-campos-dobles">
                <div><label className="novasalud-ventas-label" htmlFor="novasalud-comprobante">Comprobante</label>
                  <select id="novasalud-comprobante" className="novasalud-ventas-input" value={comprobante} onChange={(evento) => setComprobante(evento.target.value)}>
                    <option value="boleta">Boleta</option><option value="factura">Factura</option>
                  </select></div>
                <div><label className="novasalud-ventas-label" htmlFor="novasalud-metodo">Método de pago</label>
                  <select id="novasalud-metodo" className="novasalud-ventas-input" value={metodoPago} onChange={(evento) => setMetodoPago(evento.target.value)}>
                    <option value="efectivo">Efectivo</option><option value="yape">Yape</option><option value="tarjeta">Tarjeta</option>
                  </select></div>
              </div>
              {comprobante === 'factura' && <p className="novasalud-ventas-aviso">La factura requiere un cliente con RUC de 11 dígitos.</p>}
              {metodoPago === 'efectivo' && <div className="novasalud-ventas-campos-dobles">
                <div><label className="novasalud-ventas-label" htmlFor="novasalud-recibido">Monto recibido</label>
                  <input id="novasalud-recibido" className="novasalud-ventas-input" type="number" min="0" step="0.01" value={montoRecibido}
                    onChange={(evento) => setMontoRecibido(evento.target.value)} placeholder="S/ 0.00" /></div>
                <div className="novasalud-ventas-vuelto"><span>Vuelto</span><strong>{moneda(Math.max(Number(montoRecibido || 0) - total, 0))}</strong></div>
              </div>}
            </section>
          </div>

          <section className="novasalud-ventas-panel">
            <div className="novasalud-ventas-titulo-panel"><div><h2>Carrito</h2><p>{carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}</p></div></div>
            {carrito.length ? (
              <div className="novasalud-ventas-carrito">
                <div className="novasalud-ventas-lineas">
                  {carrito.map((item) => (
                    <article className="novasalud-ventas-linea" key={item.productoId}>
                      <div className="novasalud-ventas-producto-info">
                        <strong>{item.nombre}</strong><small>{item.codigo} · {moneda(item.precio)} c/u</small>
                        {item.requiereReceta && <label className="novasalud-ventas-receta">
                          <input type="checkbox" checked={item.recetaVerificada}
                            onChange={(evento) => setCarrito((actual) => actual.map((linea) => linea.productoId === item.productoId ? { ...linea, recetaVerificada: evento.target.checked } : linea))} />
                          Receta verificada
                        </label>}
                      </div>
                      <div className="novasalud-ventas-cantidad">
                        <button type="button" aria-label={`Restar ${item.nombre}`} onClick={() => actualizarUnidad(item.productoId, -1)}>−</button>
                        <input aria-label={`Cantidad de ${item.nombre}`} type="number" min="1"
                          value={item.cantidad} onChange={(evento) => cambiarCantidad(item.productoId, evento.target.value)} />
                        <button type="button" aria-label={`Sumar ${item.nombre}`} onClick={() => actualizarUnidad(item.productoId, 1)}>+</button>
                      </div>
                      <strong>{moneda(item.precio * item.cantidad)}</strong>
                      <button type="button" className="novasalud-ventas-quitar" aria-label={`Quitar ${item.nombre}`}
                        onClick={() => setCarrito((actual) => actual.filter((linea) => linea.productoId !== item.productoId))}>×</button>
                    </article>
                  ))}
                </div>
                <div className="novasalud-ventas-totales">
                  <div><span>Subtotal</span><span>{moneda(subtotal)}</span></div>
                  <div><span>IGV (18%)</span><span>{moneda(igv)}</span></div>
                  <div className="novasalud-ventas-total"><strong>Total</strong><strong>{moneda(total)}</strong></div>
                  <div className="novasalud-ventas-botones">
                    <Button variant="outline" onClick={cancelarVenta}>Cancelar venta</Button>
                    <Button variant="success" icon="💳" onClick={cobrar} disabled={!carrito.length}>Cobrar {moneda(total)}</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="novasalud-ventas-carrito-vacio"><span>🛒</span><strong>El carrito está vacío</strong><p>Busca y agrega productos para iniciar la venta.</p></div>
            )}
          </section>
        </div>
      ) : (
        <section className="novasalud-ventas-panel">
          <div className="novasalud-ventas-titulo-panel">
            <div><h2>Historial de ventas</h2><p>{esAdmin ? 'Consulta todas las ventas registradas.' : 'Consulta tus ventas registradas.'}</p></div>
          </div>
          {esAdmin && <div className="novasalud-ventas-filtros">
            <label>Desde <input type="date" value={fechaDesde} onChange={(evento) => setFechaDesde(evento.target.value)} /></label>
            <label>Hasta <input type="date" value={fechaHasta} onChange={(evento) => setFechaHasta(evento.target.value)} /></label>
            <Button size="sm" variant="outline" onClick={() => { setFechaDesde(''); setFechaHasta('') }}>Limpiar fechas</Button>
          </div>}
          <Table columns={columnasHistorial} data={ventasVisibles} emptyMessage="No hay ventas en el periodo seleccionado." emptyIcon="🧾" />
        </section>
      )}

      <Modal isOpen={modal?.tipo === 'cancelar'} onClose={() => setModal(null)} title="Cancelar venta" icon="⚠️" size="sm"
        footer={<><Button variant="outline" onClick={() => setModal(null)}>Seguir vendiendo</Button>
          <Button variant="danger" onClick={() => { limpiarVenta(); setModal(null) }}>Descartar venta</Button></>}>
        <p>¿Seguro que deseas cancelar esta venta? Se perderán los productos del carrito.</p>
      </Modal>

      <Modal isOpen={modal?.tipo === 'comprobante'} onClose={() => { setModal(null); setVentaSeleccionada(null) }} title="Comprobante de venta" icon="🧾" size="md"
        footer={<><Button variant="outline" onClick={() => window.print()}>Imprimir comprobante</Button><Button onClick={() => { setModal(null); setVentaSeleccionada(null) }}>Cerrar</Button></>}>
        {ventaSeleccionada && <div className="novasalud-ventas-comprobante">
          <div className="novasalud-ventas-comprobante-cabecera"><strong>Nova Salud</strong><span>{ventaSeleccionada.tipoComprobante.toUpperCase()}</span></div>
          <p>N° {ventaSeleccionada.id} · {new Date(ventaSeleccionada.fecha).toLocaleString('es-PE')}</p>
          <p>Cliente: {ventaSeleccionada.clienteNombre} · {ventaSeleccionada.clienteDocumento}</p>
          {ventaSeleccionada.items.map((item) => <div className="novasalud-ventas-comprobante-linea" key={item.productoId}>
            <span>{item.nombre} × {item.cantidad}</span><span>{moneda(item.precio * item.cantidad)}</span>
          </div>)}
          <div className="novasalud-ventas-comprobante-linea"><span>Subtotal</span><span>{moneda(ventaSeleccionada.subtotal)}</span></div>
          <div className="novasalud-ventas-comprobante-linea"><span>IGV</span><span>{moneda(ventaSeleccionada.igv)}</span></div>
          <div className="novasalud-ventas-comprobante-linea total"><strong>Total</strong><strong>{moneda(ventaSeleccionada.total)}</strong></div>
          <p>Pago: {ventaSeleccionada.metodoPago.toUpperCase()} · Recibido: {moneda(ventaSeleccionada.recibido)} · Vuelto: {moneda(ventaSeleccionada.vuelto)}</p>
        </div>}
      </Modal>

      <Modal isOpen={Boolean(ventaSeleccionada) && modal?.tipo !== 'comprobante'} onClose={() => setVentaSeleccionada(null)}
        title={`Detalle ${ventaSeleccionada?.id || ''}`} icon="🧾" size="md">
        {ventaSeleccionada && <div className="novasalud-ventas-detalle">
          <p><strong>Fecha:</strong> {new Date(ventaSeleccionada.fecha).toLocaleString('es-PE')}</p>
          <p><strong>Cliente:</strong> {ventaSeleccionada.clienteNombre} ({ventaSeleccionada.clienteDocumento})</p>
          <p><strong>Trabajador:</strong> {ventaSeleccionada.trabajador}</p>
          <p><strong>Comprobante:</strong> {ventaSeleccionada.tipoComprobante} · <strong>Pago:</strong> {ventaSeleccionada.metodoPago}</p>
          <div className="novasalud-ventas-detalle-items">{ventaSeleccionada.items.map((item) => <div key={item.productoId}><span>{item.nombre} × {item.cantidad}</span><strong>{moneda(item.precio * item.cantidad)}</strong></div>)}</div>
          <p><strong>Total:</strong> {moneda(ventaSeleccionada.total)} · <Badge variant={ventaSeleccionada.estado === 'completada' ? 'success' : 'neutral'}>{ventaSeleccionada.estado}</Badge></p>
        </div>}
      </Modal>

      <Modal isOpen={Boolean(ventaAnular)} onClose={() => setVentaAnular(null)} title="Anular venta" icon="⚠️" size="sm"
        footer={<><Button variant="outline" onClick={() => setVentaAnular(null)}>Volver</Button>
          <Button variant="danger" onClick={confirmarAnulacion}>Confirmar anulación</Button></>}>
        <p>¿Confirmas anular la venta <strong>{ventaAnular?.id}</strong>? Esta acción devolverá sus productos al stock.</p>
      </Modal>
    </section>
  )
}
