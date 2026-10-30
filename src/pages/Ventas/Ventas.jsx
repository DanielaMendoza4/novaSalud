import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button/Button'
import Badge from '../../components/Badge/Badge'
import EmptyState from '../../components/EmptyState/EmptyState'
import Field from '../../components/Field/Field'
import PageHeader from '../../components/PageHeader/PageHeader'
import SearchBar from '../../components/SearchBar/SearchBar'
import { clientesService, productosService, turnosService, ventasService } from '../../services'
import { ahoraEnLima, formatFecha, formatHora } from '../../utils/fechas'
import { mensajeDeError } from '../../utils/errores'
import './Ventas.css'

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`
const paymentMethods = ['efectivo', 'yape', 'plin', 'tarjeta']

export default function Ventas() {
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [turno, setTurno] = useState(null)
  const [waitingSales, setWaitingSales] = useState([])
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [clientId, setClientId] = useState('')
  const [comprobante, setComprobante] = useState('boleta')
  const [method, setMethod] = useState('efectivo')
  const [paid, setPaid] = useState('')
  const [quantityError, setQuantityError] = useState('')
  const [rowAction, setRowAction] = useState(null)
  const [state, setState] = useState({ loading: true, error: '', saving: false, success: '' })

  const load = () => Promise.all([
    productosService.listar({ q: query, page: 1, limit: 20 }),
    clientesService.listar(),
    turnosService.actual(),
    ventasService.listar({ estado: 'espera' })
  ]).then(([productResponse, clientResponse, currentTurn, waitingResponse]) => {
    setProducts(productResponse.data)
    setClients(clientResponse)
    setTurno(currentTurn)
    setWaitingSales(waitingResponse.data)
    setState((current) => ({ ...current, loading: false, error: '' }))
  }).catch((error) => setState((current) => ({ ...current, loading: false, error: error.codigo ? `${error.codigo}: ${mensajeDeError(error)}` : mensajeDeError(error) })))

  useEffect(() => { load() }, [query])

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0), [cart])
  const cash = method === 'efectivo' ? Number(paid || 0) : 0
  const change = Math.max(0, cash - total)

  const addProduct = (product) => {
    if (['agotado', 'vencido'].includes(product.estado) || product.stock_total <= 0) {
      setState((current) => ({ ...current, error: 'PRODUCTO_NO_DISPONIBLE: Este producto no se puede agregar.' }))
      return
    }
    setCart((current) => {
      const found = current.find((item) => item.producto_id === product.id)
      if (found) {
        return current.map((item) => item.producto_id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item)
      }
      return [...current, { producto_id: product.id, nombre: product.nombre, precio: product.precio, cantidad: 1, stock: product.stock_total }]
    })
  }

  const updateQuantity = (id, cantidad) => {
    const item = cart.find((current) => current.producto_id === id)
    if (item && cantidad > item.stock) {
      setQuantityError(`No puedes agregar más de ${item.stock} unidades de ${item.nombre}.`)
    } else {
      setQuantityError('')
    }
    setCart((current) => current.map((item) => item.producto_id === id
      ? { ...item, cantidad: Math.min(item.stock, Math.max(1, cantidad)) }
      : item))
  }

  const submit = async (estado) => {
    if (!cart.length) {
      setState((current) => ({ ...current, error: 'Agrega al menos un producto.' }))
      return
    }
    if (!turno) {
      setState((current) => ({ ...current, error: 'TURNO_CERRADO: Debes abrir una caja antes de vender.' }))
      return
    }
    if (estado === 'pagada' && method === 'efectivo' && cash < total) {
      setState((current) => ({ ...current, error: 'El efectivo recibido no cubre el total.' }))
      return
    }
    setState((current) => ({ ...current, saving: true, error: '', success: '' }))
    try {
      await ventasService.crear({
        cliente_id: clientId ? Number(clientId) : null,
        comprobante,
        estado,
        items: cart.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })),
        ...(estado === 'pagada' ? { pagos: [{ metodo: method, monto: Number(paid || total) }] } : {})
      })
      if (estado === 'espera') {
        setWaitingSales((current) => [...current, {
          id: Date.now(),
          serie_numero: 'B001-DEMO',
          fecha: ahoraEnLima(),
          metodo_pago: null,
          total,
          estado
        }])
      }
      setCart([])
      setPaid('')
      setState({ loading: false, saving: false, error: '', success: estado === 'espera' ? 'Venta guardada en espera.' : `Venta cobrada. Vuelto: ${money(change)}` })
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.codigo ? `${error.codigo}: ${mensajeDeError(error)}` : mensajeDeError(error) }))
    }
  }

  if (state.loading) return <div className="shared-card ventas-loading">Cargando punto de venta...</div>
  return (
    <div className="ventas-page">
      <PageHeader title="Punto de Venta" subtitle="Busca productos y agrégalos al carrito." />
      {state.error && <div className="ventas-feedback error" role="alert">{state.error}</div>}
      {state.success && <div className="ventas-feedback success" role="status">{state.success}</div>}
      <div className="ventas-layout">
        <div className="ventas-main-column">
          <section className="shared-card ventas-products-card">
            <div className="ventas-section-heading">
              <div><h2>Buscar productos</h2><p>Selecciona un producto para añadirlo al carrito.</p></div>
              <Badge variant="neutral">{products.length} resultados</Badge>
            </div>
            <SearchBar value={query} onChange={setQuery} placeholder="Buscar por nombre o código..." showScannerBadge={false} autoFocus={false} />
            <div className="ventas-product-grid">
              {products.length === 0 ? <EmptyState icon="⌕" title="No se encontraron productos" /> : products.map((product) => {
                const disabled = ['agotado', 'vencido'].includes(product.estado)
                const status = product.estado === 'normal'
                  ? { label: `Stock ${product.stock_total}`, variant: 'success' }
                  : product.estado === 'stock_bajo'
                    ? { label: `Stock bajo · ${product.stock_total}`, variant: 'warning' }
                    : product.estado === 'por_vencer'
                      ? { label: `Por vencer · ${product.stock_total}`, variant: 'warning' }
                      : product.estado === 'agotado'
                        ? { label: 'Agotado', variant: 'neutral' }
                        : { label: 'Vencido', variant: 'danger' }
                return (
                  <button className="ventas-product-card" type="button" key={product.id} onClick={() => addProduct(product)} disabled={disabled}>
                    <strong>{product.nombre}</strong>
                    <span>{product.presentacion}</span>
                    <b>{money(product.precio)}</b>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="shared-card ventas-cart-card">
            <div className="ventas-section-heading">
              <div><h2>Carrito</h2><p>Revisa los productos antes de cobrar.</p></div>
              <Badge variant="neutral">{cart.length} {cart.length === 1 ? 'producto' : 'productos'}</Badge>
            </div>
            {quantityError && <div className="ventas-inline-error" role="alert">{quantityError}</div>}
            {cart.length === 0 ? (
              <EmptyState icon="🛒" title="El carrito está vacío." description="Busca un producto o presiona F2." />
            ) : (
              <div className="ventas-cart-table">
                <div className="ventas-cart-header"><span>Producto</span><span>Cantidad</span><span>Precio</span><span>Subtotal</span><span aria-hidden="true" /></div>
                {cart.map((item) => (
                  <div className="ventas-cart-row" key={item.producto_id}>
                    <div className="ventas-cart-product"><strong>{item.nombre}</strong><small>Stock disponible: {item.stock}</small></div>
                    <div className="ventas-quantity">
                      <button type="button" aria-label="Disminuir cantidad" onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)} disabled={item.cantidad <= 1}>−</button>
                      <input aria-label={`Cantidad de ${item.nombre}`} type="number" min="1" max={item.stock} value={item.cantidad} onChange={(event) => updateQuantity(item.producto_id, Number(event.target.value))} />
                      <button type="button" aria-label="Aumentar cantidad" onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)} disabled={item.cantidad >= item.stock}>+</button>
                    </div>
                    <span>{money(item.precio)}</span>
                    <strong>{money(item.precio * item.cantidad)}</strong>
                    <button className="ventas-remove" type="button" aria-label="Quitar" onClick={() => setCart((current) => current.filter((entry) => entry.producto_id !== item.producto_id))}>×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="shared-card ventas-waiting-card">
            <div className="ventas-section-heading"><div><h2>Ventas en espera</h2><p>Continúa o descarta ventas guardadas.</p></div><Badge variant="neutral">{waitingSales.length}</Badge></div>
            {waitingSales.length === 0 ? <EmptyState icon="◷" title="No hay ventas en espera." /> : waitingSales.map((sale) => (
              <div className="ventas-waiting-row" key={sale.id}>
                <div><strong>{sale.serie_numero}</strong><span>{formatFecha(sale.fecha)} · {formatHora(sale.fecha)}</span></div>
                <strong>{money(sale.total)}</strong>
                <div className="ventas-waiting-actions">
                  <Button size="sm" loading={rowAction?.id === sale.id && rowAction.action === 'cobrar'} disabled={Boolean(rowAction)} onClick={async () => {
                    setRowAction({ id: sale.id, action: 'cobrar' })
                    try { await ventasService.cobrar(sale.id, [{ metodo: 'efectivo', monto: Number(sale.total) }]); setWaitingSales((current) => current.filter((item) => item.id !== sale.id)) } catch (error) { setState((current) => ({ ...current, error: error.codigo ? `${error.codigo}: ${mensajeDeError(error)}` : mensajeDeError(error) })) } finally { setRowAction(null) }
                  }}>Cobrar</Button>
                  <Button size="sm" variant="outline" loading={rowAction?.id === sale.id && rowAction.action === 'descartar'} disabled={Boolean(rowAction)} onClick={async () => {
                    setRowAction({ id: sale.id, action: 'descartar' })
                    try { await ventasService.descartar(sale.id); setWaitingSales((current) => current.filter((item) => item.id !== sale.id)) } catch (error) { setState((current) => ({ ...current, error: error.codigo ? `${error.codigo}: ${mensajeDeError(error)}` : mensajeDeError(error) })) } finally { setRowAction(null) }
                  }}>Descartar</Button>
                </div>
              </div>
            ))}
          </section>
        </div>

        <aside className="shared-card ventas-checkout-card">
          <div className="ventas-section-heading"><div><h2>Cobro</h2><p>Completa los datos de la venta.</p></div></div>
          <div className="ventas-checkout-form">
            <Field id="venta-cliente" label="Cliente (opcional)">
              <select id="venta-cliente" value={clientId} onChange={(event) => setClientId(event.target.value)}>
                <option value="">Sin cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.nombre} - {client.numero_doc}</option>)}
              </select>
            </Field>
            <div className="ventas-field-group"><span className="ventas-field-label">Comprobante</span><div className="ventas-segmented">{['boleta', 'factura'].map((value) => <button key={value} type="button" className={comprobante === value ? 'active' : ''} onClick={() => setComprobante(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div></div>
            <div className="ventas-field-group"><span className="ventas-field-label">Método de pago</span><div className="ventas-segmented payment">{paymentMethods.map((value) => <button key={value} type="button" className={method === value ? 'active' : ''} onClick={() => setMethod(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div></div>
            {method === 'efectivo' && <Field id="venta-efectivo" label="Efectivo recibido"><input id="venta-efectivo" type="number" min="0" step="0.01" value={paid} onChange={(event) => setPaid(event.target.value)} /><div className="ventas-quick-amounts">{[total, 10, 20, 50].map((amount, index) => <button type="button" key={`${amount}-${index}`} onClick={() => setPaid(String(amount))}>{index === 0 ? 'Exacto' : money(amount)}</button>)}</div></Field>}
          </div>
          <div className="ventas-summary"><div><span>Subtotal</span><strong>{money(total / 1.18)}</strong></div><div><span>IGV 18%</span><strong>{money(total - total / 1.18)}</strong></div>{method === 'efectivo' && <div><span>Vuelto</span><strong>{money(change)}</strong></div>}<div className="ventas-total"><span>TOTAL</span><strong>{money(total)}</strong></div></div>
          <div className="ventas-checkout-actions"><Button fullWidth size="lg" disabled={state.saving || !cart.length || (method === 'efectivo' && cash < total)} loading={state.saving} onClick={() => submit('pagada')}>Cobrar</Button><Button fullWidth variant="outline" disabled={state.saving || !cart.length} onClick={() => submit('espera')}>Guardar en espera</Button></div>
        </aside>
      </div>
    </div>
  )
}
