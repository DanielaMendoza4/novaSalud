import { useMemo, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import Button from '../../components/Button/Button'
import EmptyState from '../../components/EmptyState/EmptyState'
import Field from '../../components/Field/Field'
import Modal from '../../components/Modal/Modal'
import PageHeader from '../../components/PageHeader/PageHeader'
import SearchBar from '../../components/SearchBar/SearchBar'
import Table from '../../components/Table/Table'
import { useDatos } from '../../context/useDatos'
import './Inventario.css'

const emptyProduct = {
  codigo: '',
  nombre: '',
  categoria: '',
  precio: '',
  minimo: '',
  fechaVencimiento: '',
  requiereReceta: false
}

const emptyRestock = { cantidad: '' }
const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`
const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

function getStatus(product) {
  const today = localDate(new Date())
  if (product.fechaVencimiento && product.fechaVencimiento < today) {
    return { value: 'vencido', label: 'Vencido', variant: 'danger' }
  }
  if (product.stock <= 0) return { value: 'agotado', label: 'Agotado', variant: 'danger' }
  if (product.stock <= product.minimo) return { value: 'stock_bajo', label: 'Stock bajo', variant: 'warning' }
  const limit = new Date()
  limit.setDate(limit.getDate() + 30)
  if (product.fechaVencimiento && product.fechaVencimiento <= localDate(limit)) {
    return { value: 'por_vencer', label: 'Por vencer', variant: 'warning' }
  }
  return { value: 'normal', label: 'Normal', variant: 'success' }
}

function productWithStatus(product) {
  const status = getStatus(product)
  return { ...product, estado: status.value, estadoLabel: status.label }
}

export default function Inventario() {
  const { productos, setProductos } = useDatos()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [modal, setModal] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [restockForm, setRestockForm] = useState(emptyRestock)
  const [feedback, setFeedback] = useState({ error: '', success: '' })

  const products = useMemo(() => productos.map(productWithStatus), [productos])
  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.codigo} ${product.nombre} ${product.categoria}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (statusFilter === 'todos' || product.estado === statusFilter)
  }), [products, query, statusFilter])
  const lowStockCount = products.filter((product) => ['agotado', 'stock_bajo'].includes(product.estado)).length
  const inventoryValue = products.reduce((total, product) => total + Number(product.precio) * product.stock, 0)

  const openNewProduct = () => {
    setSelectedProduct(null)
    setProductForm(emptyProduct)
    setFeedback({ error: '', success: '' })
    setModal('producto')
  }

  const openEditProduct = (product) => {
    setSelectedProduct(product)
    setProductForm({
      codigo: product.codigo,
      nombre: product.nombre,
      categoria: product.categoria,
      precio: String(product.precio),
      minimo: String(product.minimo),
      fechaVencimiento: product.fechaVencimiento,
      requiereReceta: Boolean(product.requiereReceta)
    })
    setFeedback({ error: '', success: '' })
    setModal('producto')
  }

  const saveProduct = (event) => {
    event.preventDefault()
    const codigo = productForm.codigo.trim()
    const duplicateCode = productos.some((product) =>
      product.codigo.toLowerCase() === codigo.toLowerCase() && product.id !== selectedProduct?.id
    )
    if (duplicateCode) {
      setFeedback({ error: 'Ya existe un producto con ese código.', success: '' })
      return
    }

    const productDetails = {
      codigo,
      nombre: productForm.nombre.trim(),
      categoria: productForm.categoria.trim(),
      precio: Number(productForm.precio),
      minimo: Number(productForm.minimo),
      fechaVencimiento: productForm.fechaVencimiento,
      requiereReceta: productForm.requiereReceta
    }

    if (selectedProduct) {
      setProductos((current) => current.map((product) => product.id === selectedProduct.id
        ? productWithStatus({ ...product, ...productDetails })
        : product))
      setFeedback({ error: '', success: 'Producto actualizado correctamente.' })
    } else {
      const newProduct = productWithStatus({
        ...productDetails,
        id: Date.now(),
        stock: 0
      })
      setProductos((current) => [newProduct, ...current])
      setFeedback({ error: '', success: 'Producto creado. Repón unidades para habilitarlo en ventas.' })
    }
    setModal('')
  }

  const openRestock = (product) => {
    setSelectedProduct(product)
    setRestockForm(emptyRestock)
    setFeedback({ error: '', success: '' })
    setModal('reposicion')
  }

  const restockProduct = (event) => {
    event.preventDefault()
    const quantity = Number(restockForm.cantidad)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setFeedback({ error: 'Ingresa una cantidad entera mayor que cero.', success: '' })
      return
    }
    setProductos((current) => current.map((product) => product.id === selectedProduct.id
      ? productWithStatus({ ...product, stock: product.stock + quantity })
      : product))
    setFeedback({ error: '', success: `Se agregaron ${quantity} unidades a ${selectedProduct.nombre}.` })
    setModal('')
  }

  const deleteProduct = (product) => {
    if (!window.confirm(`¿Eliminar ${product.nombre} del inventario?`)) return
    setProductos((current) => current.filter((entry) => entry.id !== product.id))
    setFeedback({ error: '', success: `${product.nombre} fue eliminado del inventario.` })
  }

  const columns = [
    { header: 'Código', key: 'codigo' },
    { header: 'Producto', key: 'nombre', render: (name, product) => <div className="inventory-product-name"><strong>{name}</strong><span>{product.categoria}</span></div> },
    { header: 'Stock', key: 'stock', render: (stock) => <strong>{stock}</strong> },
    { header: 'Mínimo', key: 'minimo' },
    { header: 'Vencimiento', key: 'fechaVencimiento', render: (date) => date ? new Date(`${date}T00:00:00`).toLocaleDateString('es-PE') : '—' },
    { header: 'Precio', key: 'precio', render: (price) => money(price) },
    { header: 'Estado', key: 'estado', render: (status, product) => <Badge variant={getStatus(product).variant}>{getStatus(product).label}</Badge> },
    {
      header: 'Acciones',
      key: 'acciones',
      render: (_, product) => (
        <div className="inventory-actions">
          <Button size="sm" variant="outline" onClick={() => openRestock(product)}>Reponer</Button>
          <Button size="sm" variant="ghost" onClick={() => openEditProduct(product)}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={() => deleteProduct(product)} aria-label={`Eliminar ${product.nombre}`}>Eliminar</Button>
        </div>
      )
    }
  ]

  return (
    <div className="inventory-page">
      <PageHeader
        title="Inventario"
        subtitle="Administra productos, existencias y fechas de vencimiento."
        action={<Button onClick={openNewProduct} icon="+">Nuevo producto</Button>}
      />
      {feedback.error && <div className="inventory-feedback error" role="alert">{feedback.error}</div>}
      {feedback.success && <div className="inventory-feedback success" role="status">{feedback.success}</div>}
      <div className="inventory-summary">
        <article className="shared-card"><span>Productos registrados</span><strong>{products.length}</strong></article>
        <article className="shared-card"><span>Productos con stock crítico</span><strong className={lowStockCount ? 'inventory-warning' : ''}>{lowStockCount}</strong></article>
        <article className="shared-card"><span>Valor estimado del stock</span><strong>{money(inventoryValue)}</strong></article>
      </div>
      <section className="shared-card inventory-list">
        <div className="inventory-list-heading">
          <div><h2>Catálogo de productos</h2><p>{filteredProducts.length} de {products.length} productos</p></div>
          <label className="inventory-filter">
            <span>Estado</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="todos">Todos</option>
              <option value="normal">Normal</option>
              <option value="stock_bajo">Stock bajo</option>
              <option value="agotado">Agotado</option>
              <option value="por_vencer">Por vencer</option>
              <option value="vencido">Vencido</option>
            </select>
          </label>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por código, nombre o categoría..." showScannerBadge={false} autoFocus={false} />
        {filteredProducts.length === 0
          ? <EmptyState icon="⌕" title="No se encontraron productos" description="Prueba con otro término o cambia el filtro de estado." />
          : <Table columns={columns} data={filteredProducts} className="inventory-table" />}
      </section>

      <Modal
        isOpen={modal === 'producto'}
        onClose={() => setModal('')}
        title={selectedProduct ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal('')}>Cancelar</Button>
            <Button type="submit" form="inventory-product-form">{selectedProduct ? 'Guardar cambios' : 'Crear producto'}</Button>
          </>
        }
      >
        <form id="inventory-product-form" className="inventory-form" onSubmit={saveProduct}>
          <Field id="inventory-code" label="Código">
            <input id="inventory-code" required maxLength="30" value={productForm.codigo} onChange={(event) => setProductForm({ ...productForm, codigo: event.target.value })} />
          </Field>
          <Field id="inventory-name" label="Nombre">
            <input id="inventory-name" required maxLength="100" value={productForm.nombre} onChange={(event) => setProductForm({ ...productForm, nombre: event.target.value })} />
          </Field>
          <Field id="inventory-category" label="Categoría">
            <input id="inventory-category" required maxLength="50" value={productForm.categoria} onChange={(event) => setProductForm({ ...productForm, categoria: event.target.value })} />
          </Field>
          <Field id="inventory-price" label="Precio (S/)">
            <input id="inventory-price" type="number" min="0.01" step="0.01" required value={productForm.precio} onChange={(event) => setProductForm({ ...productForm, precio: event.target.value })} />
          </Field>
          <Field id="inventory-minimum" label="Stock mínimo">
            <input id="inventory-minimum" type="number" min="0" step="1" required value={productForm.minimo} onChange={(event) => setProductForm({ ...productForm, minimo: event.target.value })} />
          </Field>
          <Field id="inventory-expiration" label="Fecha de vencimiento">
            <input id="inventory-expiration" type="date" required value={productForm.fechaVencimiento} onChange={(event) => setProductForm({ ...productForm, fechaVencimiento: event.target.value })} />
          </Field>
          <label className="inventory-checkbox">
            <input type="checkbox" checked={productForm.requiereReceta} onChange={(event) => setProductForm({ ...productForm, requiereReceta: event.target.checked })} />
            Requiere receta médica
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={modal === 'reposicion'}
        onClose={() => setModal('')}
        title={`Reponer ${selectedProduct?.nombre || 'producto'}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal('')}>Cancelar</Button>
            <Button type="submit" form="inventory-restock-form">Agregar unidades</Button>
          </>
        }
      >
        <form id="inventory-restock-form" onSubmit={restockProduct}>
          <p className="inventory-restock-current">Stock actual: <strong>{selectedProduct?.stock ?? 0}</strong></p>
          <Field id="inventory-restock-quantity" label="Cantidad a reponer">
            <input id="inventory-restock-quantity" type="number" min="1" step="1" required autoFocus value={restockForm.cantidad} onChange={(event) => setRestockForm({ cantidad: event.target.value })} />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
