import { useEffect, useState } from 'react'
import Card from '../../components/Card/Card'
import Badge from '../../components/Badge/Badge'
import Table from '../../components/Table/Table'
import { avisosService, productosService, resumenService } from '../../services'
import { useAuth } from '../../context'
import { mensajeDeError } from '../../utils/errores'

const roleConfig = {
  admin: {
    title: 'Panel administrativo',
    blocks: ['ventas', 'stock', 'vencimientos', 'inventario'],
    menuTitle: 'Resumen global'
  },
  trabajador: {
    title: 'Panel del trabajador',
    blocks: ['ventas', 'caja', 'digitales', 'espera'],
    menuTitle: 'Resumen de mi operación'
  }
}

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`

export default function Dashboard() {
  const { usuario } = useAuth()
  const config = roleConfig[usuario.rol] || roleConfig.trabajador
  const [summary, setSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [avisos, setAvisos] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    let active = true
    Promise.all([
      resumenService.obtener(usuario.rol),
      productosService.listar({ page: 1, limit: 20 }),
      avisosService.listar()
    ]).then(([summaryResponse, productResponse, avisosResponse]) => {
      if (!active) return
      setSummary(summaryResponse)
      setProducts(productResponse.data)
      setAvisos(avisosResponse)
      setState({ loading: false, error: '' })
    }).catch((error) => {
      if (active) setState({ loading: false, error: mensajeDeError(error) })
    })
    return () => { active = false }
  }, [usuario.rol])

  if (state.loading) return <div className="panel-card">Cargando resumen...</div>
  if (state.error) return <div className="panel-card" role="alert">{state.error}</div>

  const cards = {
    ventas: { title: 'Ventas de hoy', value: money(summary.ventas_hoy?.monto), subtitle: `${summary.ventas_hoy?.tickets || summary.ventas_hoy?.transacciones || 0} tickets`, variant: 'primary' },
    stock: { title: 'Stock bajo', value: summary.stock_bajo?.cantidad || 0, subtitle: `${summary.stock_bajo?.criticos || 0} críticos`, variant: 'danger' },
    vencimientos: { title: 'Por vencer', value: summary.por_vencer?.cantidad || 0, subtitle: `En los próximos ${summary.por_vencer?.dias || 0} días`, variant: 'warning' },
    inventario: { title: 'Inventario', value: summary.inventario?.items || 0, subtitle: 'Ítems registrados', variant: 'info' },
    caja: { title: 'Efectivo en caja', value: money(summary.efectivo_en_caja), subtitle: summary.turno ? `Turno #${summary.turno.id} abierto` : 'Sin turno abierto', variant: 'success' },
    digitales: { title: 'Pagos digitales', value: money(summary.pagos_digitales), subtitle: 'Yape, Plin y tarjeta', variant: 'info' },
    espera: { title: 'Ventas en espera', value: summary.ventas_en_espera || 0, subtitle: 'Pendientes de cobro', variant: 'warning' }
  }

  return (
    <div className="dashboard-view">
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h1>{config.title}</h1>
          <p>{config.menuTitle}. Datos sincronizados con Nova Salud.</p>
        </div>
      </div>

      <section>
        <h2 className="dashboard-section-title">
          <span>Resumen de operaciones</span>
          <Badge variant="primary" dot>En vivo</Badge>
        </h2>
        <div className="kpi-grid">
          {config.blocks.map((block) => <Card key={block} {...cards[block]} />)}
        </div>
      </section>

      <div className="dashboard-grid-2col">
        <div className="panel-card">
          <h2 className="dashboard-section-title"><span>Productos</span><Badge variant="neutral">{products.length}</Badge></h2>
          {products.length === 0 ? <p>No hay productos para mostrar.</p> : (
            <Table
              columns={[
                { header: 'Código', key: 'codigo' },
                { header: 'Producto', key: 'nombre' },
                { header: 'Stock', key: 'stock_total' },
                { header: 'Estado', key: 'estado' }
              ]}
              data={products}
            />
          )}
        </div>
        <div className="panel-card">
          <h2 className="dashboard-section-title"><span>Avisos de stock</span><Badge variant="danger">{avisos.length}</Badge></h2>
          {avisos.length === 0 ? <p>No hay avisos pendientes.</p> : avisos.map((aviso) => (
            <div key={`${aviso.producto_id}-${aviso.tipo}`} style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
              <strong>{aviso.nombre}</strong>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>{aviso.detalle}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
