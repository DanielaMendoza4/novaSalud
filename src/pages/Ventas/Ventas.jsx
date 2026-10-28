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
  const [mostrarDisponibles, setMostrarDisponibles] = useState(false)
  const [carrito, setCarrito] = useState([])
  const [clienteId, setClienteId] = useState(1)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [documentoCliente, setDocumentoCliente] = useState('00000000')
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
  const cobrarRef = useRef(null)
  const ponerEnEsperaRef = useRef(null)

  const total = redondear(carrito.reduce((importe, item) => importe + item.precio * item.cantidad, 0))
  const subtotal = redondear(total / 1.18)
  const igv = redondear(total - subtotal)
  const clienteSeleccionado = clientes.find((cliente) => cliente.id === clienteId) || clientes[0]
  const coincidenciasProducto = useMemo(() => {
    const termino = normalizar(busquedaProducto)
    if (!termino) return []
    return productos.filter((producto) =>
      normalizar(`${producto.nombre} ${producto.codigo}`).includes(termino)
    ).slice(0, 5)
  }, [busquedaProducto, productos])
  const productosDisponibles = useMemo(
    () => productos.filter((producto) => producto.stock > 0 && producto.fechaVencimiento >= fechaLocal()),
    [productos]
  )
  const productosRapidos = useMemo(() => {
    const vendidos = new Map()
    ventas.forEach((venta) => venta.items.forEach((item) => {
      vendidos.set(item.productoId, (vendidos.get(item.productoId) || 0) + item.cantidad)
    }))
    return [...productosDisponibles]
      .sort((a, b) => (vendidos.get(b.id) || 0) - (vendidos.get(a.id) || 0))
      .slice(0, 4)
  }, [productosDisponibles, ventas])

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
    setDocumentoCliente('00000000')
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
    if (comprobante === 'factura' && !/^\d{11}$/.test(documentoCliente)) {
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
      clienteDocumento: documentoCliente,
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

  const ponerEnEspera = () => {
    if (!carrito.length) {
      avisar('Agrega al menos un producto antes de poner la venta en espera.')
      return
    }
    avisar('La venta queda disponible solo durante esta sesión.', 'info', 'Venta en espera')
  }

  cobrarRef.current = cobrar
  ponerEnEsperaRef.current = ponerEnEspera

  useEffect(() => {
    const onKeyDown = (evento) => {
      if (pestana !== 'nueva') return
      if (evento.key === 'F2') {
        evento.preventDefault()
        busquedaRef.current?.focus()
      }
      if (evento.key === 'F9') {
        evento.preventDefault()
        cobrarRef.current?.()
      }
      if (evento.key === 'F6') {
        evento.preventDefault()
        ponerEnEsperaRef.current?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pestana])

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
    setDocumentoCliente(cliente.documento)
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
        <div className="novasalud-ventas-pos">
          <div className="novasalud-ventas-columna-principal">
            <section className="novasalud-ventas-panel">
              <div className="novasalud-ventas-titulo-panel">
                <div><h2>Buscar producto</h2><p>Busca por nombre, código o escanea el código de barras.</p></div>
                <span className="novasalud-ventas-atajo">F2</span>
              </div>
              <div className="novasalud-ventas-busqueda-producto">
                <input id="novasalud-busqueda-producto" ref={busquedaRef} className="novasalud-ventas-input"
                  value={busquedaProducto} onChange={(evento) => {
                    setBusquedaProducto(evento.target.value)
                    setMostrarDisponibles(false)
                  }}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter') {
                      evento.preventDefault()
                      const coincidencia = productos.find((producto) =>
                        normalizar(producto.codigo) === normalizar(busquedaProducto) ||
                        normalizar(producto.nombre) === normalizar(busquedaProducto)
                      ) || coincidenciasProducto[0]
                      agregarProducto(coincidencia)
                    }
                  }}                   placeholder="Nombre, código o escanea el código de barras" autoComplete="off" />
                <button
                  type="button"
                  className="novasalud-ventas-disponibles-btn"
                  onClick={() => setMostrarDisponibles((actual) => !actual)}
                  aria-expanded={mostrarDisponibles}
                >
                  {mostrarDisponibles ? 'Ocultar disponibles' : 'Ver disponibles'}
                </button>
              </div>
              <div className="novasalud-ventas-productos-rapidos">
                {productosRapidos.map((producto) => (
                  <button type="button" key={producto.id} onClick={() => agregarProducto(producto)}>
                    {producto.nombre}
                  </button>
                ))}
              </div>
              {(busquedaProducto || mostrarDisponibles) && (
                <div className="novasalud-ventas-resultados">
                  {(mostrarDisponibles ? productosDisponibles : coincidenciasProducto).length ? (mostrarDisponibles ? productosDisponibles : coincidenciasProducto).map((producto) => {
                    const estado = estadoProducto(producto)
                    return (
                      <button key={producto.id} type="button"
                        className="novasalud-ventas-resultado" onClick={() => agregarProducto(producto)}>
                        <span><strong>{producto.nombre}</strong><small>{producto.codigo} · Stock: {producto.stock}</small></span>
                        <span className="novasalud-ventas-resultado-derecha"><strong>{moneda(producto.precio)}</strong><Badge variant={estado.variante} size="sm">{estado.texto}</Badge></span>
                      </button>
                    )
                  }) : <p className="novasalud-ventas-sin-resultados">{mostrarDisponibles ? 'No hay productos disponibles en stock.' : 'No hay productos que coincidan.'}</p>}
                </div>
              )}
              <div className="novasalud-ventas-tip">Los productos vencidos o agotados no se pueden agregar.</div>
            </section>

              <section className="novasalud-ventas-panel novasalud-ventas-carrito-panel">
                <div className="novasalud-ventas-titulo-panel">
                  <div><h2>Carrito</h2><p>{carrito.length} {carrito.length === 1 ? 'producto' : 'productos'}</p></div>
                </div>
                {carrito.length ? (
                  <div className="novasalud-ventas-carrito">
                    <div className="novasalud-ventas-tabla-cabecera"><span>Producto</span><span>Cantidad</span><span>Precio</span><span>Subtotal</span><span></span></div>
                    <div className="novasalud-ventas-lineas">
                      {carrito.map((item) => {
                        const producto = productos.find((actual) => actual.id === item.productoId)
                        return (
                          <article className="novasalud-ventas-linea" key={item.productoId}>
                            <div className="novasalud-ventas-producto-info">
                              <strong>{item.nombre}</strong>
                              <small>{item.codigo} · Vence {producto?.fechaVencimiento || 'No registrado'}</small>
                              {item.requiereReceta && <label className="novasalud-ventas-receta-badge">
                                <input type="checkbox" checked={item.recetaVerificada}
                                  onChange={(evento) => setCarrito((actual) => actual.map((linea) => linea.productoId === item.productoId ? { ...linea, recetaVerificada: evento.target.checked } : linea))} />
                                Receta
                              </label>}
                            </div>
                            <div className="novasalud-ventas-cantidad">
                              <button type="button" aria-label={`Restar ${item.nombre}`} onClick={() => actualizarUnidad(item.productoId, -1)}>−</button>
                              <input aria-label={`Cantidad de ${item.nombre}`} type="number" min="1" value={item.cantidad} onChange={(evento) => cambiarCantidad(item.productoId, evento.target.value)} />
                              <button type="button" aria-label={`Sumar ${item.nombre}`} onClick={() => actualizarUnidad(item.productoId, 1)}>+</button>
                            </div>
                            <span>{moneda(item.precio)}</span>
                            <strong>{moneda(item.precio * item.cantidad)}</strong>
                            <button type="button" className="novasalud-ventas-quitar" aria-label={`Quitar ${item.nombre}`} onClick={() => setCarrito((actual) => actual.filter((linea) => linea.productoId !== item.productoId))}>×</button>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="novasalud-ventas-carrito-vacio"><span aria-hidden="true">⌕</span><strong>Presiona F2 para buscar</strong><p>Agrega productos disponibles para iniciar la venta.</p></div>
                )}
              </section>
          </div>

          <aside className="novasalud-ventas-panel novasalud-ventas-cobro">
              <div className="novasalud-ventas-titulo-panel"><div><h2>Cliente</h2><p>Datos para el comprobante.</p></div></div>
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
            <label className="novasalud-ventas-label" htmlFor="novasalud-documento">Documento {comprobante === 'factura' ? '(RUC)' : '(DNI opcional)'}</label>
            <input id="novasalud-documento" className="novasalud-ventas-input" value={documentoCliente} onChange={(evento) => setDocumentoCliente(evento.target.value.replace(/\D/g, ''))} maxLength={comprobante === 'factura' ? 11 : 8} placeholder={comprobante === 'factura' ? 'RUC de 11 dígitos' : 'DNI de 8 dígitos'} />
            <label className="novasalud-ventas-label">Comprobante</label>
            <div className="novasalud-ventas-opciones">
              {['boleta', 'factura'].map((tipo) => (
                <button type="button" className={comprobante === tipo ? 'activo' : ''} key={tipo} onClick={() => setComprobante(tipo)}>{tipo[0].toUpperCase() + tipo.slice(1)}</button>
              ))}
            </div>
            {comprobante === 'factura' && <p className="novasalud-ventas-aviso">La factura requiere un RUC de 11 dígitos.</p>}
            <label className="novasalud-ventas-label">Método de pago</label>
            <div className="novasalud-ventas-opciones cuatro">
              {['efectivo', 'yape', 'plin', 'tarjeta'].map((metodo) => (
                <button type="button" className={metodoPago === metodo ? 'activo' : ''} key={metodo} onClick={() => setMetodoPago(metodo)}>{metodo[0].toUpperCase() + metodo.slice(1)}</button>
              ))}
            </div>
            {metodoPago === 'efectivo' && (
              <>
                <label className="novasalud-ventas-label" htmlFor="novasalud-recibido">Monto recibido</label>
                <input id="novasalud-recibido" className="novasalud-ventas-input" type="number" min="0" step="0.01" value={montoRecibido} onChange={(evento) => setMontoRecibido(evento.target.value)} placeholder="S/ 0.00" />
                <div className="novasalud-ventas-montos-rapidos">
                  {[total, 10, 20, 50, 100].map((monto) => <button type="button" key={monto} onClick={() => setMontoRecibido(String(monto))}>{monto === total ? 'Exacto' : moneda(monto)}</button>)}
                </div>
              </>
            )}
            <div className="novasalud-ventas-resumen">
              <div><span>Subtotal</span><span>{moneda(subtotal)}</span></div>
              <div><span>IGV 18%</span><span>{moneda(igv)}</span></div>
              {metodoPago === 'efectivo' && <div><span>Vuelto</span><span>{moneda(Math.max(Number(montoRecibido || 0) - total, 0))}</span></div>}
              <div className="novasalud-ventas-total"><strong>TOTAL</strong><strong>{moneda(total)}</strong></div>
            </div>
            <div className="novasalud-ventas-cobro-botones">
              <Button variant="success" onClick={cobrar} disabled={!carrito.length}>Cobrar · F9</Button>
              <Button variant="outline" onClick={ponerEnEspera}>Poner en espera · F6</Button>
              <Button variant="ghost" onClick={cancelarVenta}>Cancelar venta</Button>
            </div>
          </aside>
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
          <Table columns={columnasHistorial} data={ventasVisibles} emptyMessage="No hay ventas en el periodo seleccionado." />
        </section>
      )}

      <Modal isOpen={modal?.tipo === 'cancelar'} onClose={() => setModal(null)} title="Cancelar venta" size="sm"
        footer={<><Button variant="outline" onClick={() => setModal(null)}>Seguir vendiendo</Button>
          <Button variant="danger" onClick={() => { limpiarVenta(); setModal(null) }}>Descartar venta</Button></>}>
        <p>¿Seguro que deseas cancelar esta venta? Se perderán los productos del carrito.</p>
      </Modal>

      <Modal isOpen={modal?.tipo === 'comprobante'} onClose={() => { setModal(null); setVentaSeleccionada(null) }} title="Comprobante de venta" size="md"
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
        title={`Detalle ${ventaSeleccionada?.id || ''}`} size="md">
        {ventaSeleccionada && <div className="novasalud-ventas-detalle">
          <p><strong>Fecha:</strong> {new Date(ventaSeleccionada.fecha).toLocaleString('es-PE')}</p>
          <p><strong>Cliente:</strong> {ventaSeleccionada.clienteNombre} ({ventaSeleccionada.clienteDocumento})</p>
          <p><strong>Trabajador:</strong> {ventaSeleccionada.trabajador}</p>
          <p><strong>Comprobante:</strong> {ventaSeleccionada.tipoComprobante} · <strong>Pago:</strong> {ventaSeleccionada.metodoPago}</p>
          <div className="novasalud-ventas-detalle-items">{ventaSeleccionada.items.map((item) => <div key={item.productoId}><span>{item.nombre} × {item.cantidad}</span><strong>{moneda(item.precio * item.cantidad)}</strong></div>)}</div>
          <p><strong>Total:</strong> {moneda(ventaSeleccionada.total)} · <Badge variant={ventaSeleccionada.estado === 'completada' ? 'success' : 'neutral'}>{ventaSeleccionada.estado}</Badge></p>
        </div>}
      </Modal>

      <Modal isOpen={Boolean(ventaAnular)} onClose={() => setVentaAnular(null)} title="Anular venta" size="sm"
        footer={<><Button variant="outline" onClick={() => setVentaAnular(null)}>Volver</Button>
          <Button variant="danger" onClick={confirmarAnulacion}>Confirmar anulación</Button></>}>
        <p>¿Confirmas anular la venta <strong>{ventaAnular?.id}</strong>? Esta acción devolverá sus productos al stock.</p>
      </Modal>
    </section>
  )
}
