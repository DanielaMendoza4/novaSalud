import { useMemo, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import Button from '../../components/Button/Button'
import Modal from '../../components/Modal/Modal'
import Table from '../../components/Table/Table'
import Toast from '../../components/Toast/Toast'
import { useAuth } from '../../context'
import { useDatos } from '../../context/useDatos'
import './Clientes.css'

const CLIENTES_POR_PAGINA = 8
const formularioVacio = {
  nombre: '',
  tipoDocumento: 'DNI',
  documento: '',
  telefono: '',
  correo: '',
  direccion: '',
  estado: 'activo'
}

export default function Clientes() {
  const { usuario } = useAuth()
  const { clientes, setClientes, ventas } = useDatos()
  const esAdmin = usuario?.rol === 'admin'
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState(null)
  const [clienteActivo, setClienteActivo] = useState(null)
  const [formulario, setFormulario] = useState(formularioVacio)
  const [errores, setErrores] = useState({})
  const [toast, setToast] = useState(null)

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.toLocaleLowerCase('es-PE').trim()
    return clientes.filter((cliente) => {
      const coincideTexto = !termino ||
        `${cliente.nombre} ${cliente.documento} ${cliente.telefono}`.toLocaleLowerCase('es-PE').includes(termino)
      const coincideEstado = filtroEstado === 'todos' || cliente.estado === filtroEstado
      return coincideTexto && coincideEstado
    })
  }, [busqueda, clientes, filtroEstado])

  const paginas = Math.max(1, Math.ceil(clientesFiltrados.length / CLIENTES_POR_PAGINA))
  const paginaActual = Math.min(pagina, paginas)
  const clientesPagina = clientesFiltrados.slice((paginaActual - 1) * CLIENTES_POR_PAGINA, paginaActual * CLIENTES_POR_PAGINA)

  const avisar = (message, type = 'success', title = type === 'error' ? 'No se pudo completar' : 'Operación completada') => {
    setToast({ message, type, title })
  }

  const validar = () => {
    const nuevosErrores = {}
    const nombre = formulario.nombre.trim()
    const documento = formulario.documento.trim()
    const telefono = formulario.telefono.trim()
    const correo = formulario.correo.trim()
    const regexDocumento = formulario.tipoDocumento === 'DNI' ? /^\d{8}$/ : /^\d{11}$/
    if (!nombre) nuevosErrores.nombre = 'Ingresa los nombres o razón social.'
    if (!regexDocumento.test(documento)) {
      nuevosErrores.documento = `El ${formulario.tipoDocumento} debe tener ${formulario.tipoDocumento === 'DNI' ? '8' : '11'} dígitos.`
    } else if (clientes.some((cliente) =>
      cliente.documento === documento && cliente.id !== clienteActivo?.id
    )) {
      nuevosErrores.documento = 'Este documento ya está registrado.'
    }
    if (!/^9\d{8}$/.test(telefono)) nuevosErrores.telefono = 'El celular debe tener 9 dígitos y comenzar con 9.'
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) nuevosErrores.correo = 'Ingresa un correo electrónico válido.'
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const abrirNuevo = () => {
    if (usuario?.rol !== 'admin') {
      avisar('Solo el administrador puede registrar clientes.', 'error')
      return
    }
    setClienteActivo(null)
    setFormulario(formularioVacio)
    setErrores({})
    setModal('formulario')
  }

  const abrirEdicion = (cliente) => {
    if (usuario?.rol !== 'admin') {
      avisar('Solo el administrador puede editar clientes.', 'error')
      return
    }
    if (cliente.protegido) {
      avisar('El cliente general no se puede editar.', 'error')
      return
    }
    setClienteActivo(cliente)
    setFormulario({
      nombre: cliente.nombre,
      tipoDocumento: cliente.tipoDocumento,
      documento: cliente.documento,
      telefono: cliente.telefono,
      correo: cliente.correo || '',
      direccion: cliente.direccion || '',
      estado: cliente.estado
    })
    setErrores({})
    setModal('formulario')
  }

  const guardarCliente = (evento) => {
    evento.preventDefault()
    if (usuario?.rol !== 'admin') {
      avisar('No tienes permiso para modificar clientes.', 'error')
      return
    }
    if (!validar()) return
    const datosLimpios = {
      ...formulario,
      nombre: formulario.nombre.trim(),
      documento: formulario.documento.trim(),
      telefono: formulario.telefono.trim(),
      correo: formulario.correo.trim(),
      direccion: formulario.direccion.trim()
    }
    if (clienteActivo) {
      setClientes((actuales) => actuales.map((cliente) =>
        cliente.id === clienteActivo.id ? { ...cliente, ...datosLimpios } : cliente
      ))
      avisar('Los datos del cliente fueron actualizados.')
    } else {
      setClientes((actuales) => [...actuales, { id: Date.now(), ...datosLimpios }])
      avisar('El cliente fue registrado correctamente.')
    }
    setModal(null)
  }

  const solicitarEliminar = (cliente) => {
    if (usuario?.rol !== 'admin') {
      avisar('Solo el administrador puede eliminar o desactivar clientes.', 'error')
      return
    }
    if (cliente.protegido) {
      avisar('El cliente general no se puede eliminar ni desactivar.', 'error')
      return
    }
    setClienteActivo(cliente)
    setModal('eliminar')
  }

  const confirmarEliminar = () => {
    if (usuario?.rol !== 'admin') {
      avisar('No tienes permiso para eliminar o desactivar clientes.', 'error')
      setModal(null)
      return
    }
    const tieneVentas = ventas.some((venta) => venta.clienteId === clienteActivo.id)
    if (tieneVentas) {
      setClientes((actuales) => actuales.map((cliente) =>
        cliente.id === clienteActivo.id ? { ...cliente, estado: 'inactivo' } : cliente
      ))
      avisar('Este cliente tiene ventas asociadas y se desactivó para conservar su historial.', 'warning', 'Cliente desactivado')
    } else {
      setClientes((actuales) => actuales.filter((cliente) => cliente.id !== clienteActivo.id))
      avisar('El cliente fue eliminado.')
    }
    setModal(null)
    setClienteActivo(null)
  }

  const mostrarDetalle = (cliente) => {
    setClienteActivo(cliente)
    setModal('detalle')
  }

  const comprasCliente = ventas.filter((venta) => venta.clienteId === clienteActivo?.id)
  const gastoCliente = comprasCliente
    .filter((venta) => venta.estado === 'completada')
    .reduce((total, venta) => total + venta.total, 0)

  const columnas = [
    { header: 'Cliente', key: 'nombre', render: (nombre, cliente) => <div className="novasalud-clientes-nombre"><strong>{nombre}</strong>{cliente.protegido && <span>Venta sin identificar</span>}</div> },
    { header: 'Documento', key: 'documento', render: (documento, cliente) => <span>{cliente.tipoDocumento} · {documento}</span> },
    { header: 'Teléfono', key: 'telefono', render: (telefono) => telefono || '—' },
    { header: 'Correo', key: 'correo', render: (correo) => correo || '—' },
    { header: 'Estado', key: 'estado', render: (estado) => <Badge variant={estado === 'activo' ? 'success' : 'neutral'}>{estado}</Badge> },
    {
      header: 'Acciones',
      key: 'acciones',
      render: (_, cliente) => (
        <div className="novasalud-clientes-acciones">
          <button type="button" className="novasalud-clientes-accion" onClick={() => mostrarDetalle(cliente)}>Ver detalle</button>
          {esAdmin && !cliente.protegido && <>
            <button type="button" className="novasalud-clientes-accion" aria-label={`Editar ${cliente.nombre}`} onClick={() => abrirEdicion(cliente)}>Editar</button>
            <button type="button" className="novasalud-clientes-accion peligro" aria-label={`Eliminar ${cliente.nombre}`} onClick={() => solicitarEliminar(cliente)}>Eliminar</button>
          </>}
        </div>
      )
    }
  ]

  return (
    <section className="novasalud-clientes">
      {toast && <div className="novasalud-clientes-toast"><Toast {...toast} onClose={() => setToast(null)} /></div>}
      <header className="novasalud-clientes-encabezado">
        <div>
          <p className="novasalud-clientes-eyebrow">DIRECTORIO</p>
          <h1>Clientes</h1>
          <p>Consulta los datos y el historial de compras de tus clientes.</p>
        </div>
        {esAdmin && <Button icon="＋" onClick={abrirNuevo}>Nuevo cliente</Button>}
      </header>

      <section className="novasalud-clientes-panel">
        <div className="novasalud-clientes-controles">
          <label className="novasalud-clientes-busqueda">
            <span>Buscar cliente</span>
            <input type="search" value={busqueda} onChange={(evento) => { setBusqueda(evento.target.value); setPagina(1) }}
              placeholder="Nombre, documento o teléfono" />
          </label>
          <label className="novasalud-clientes-filtro">
            <span>Estado</span>
            <select value={filtroEstado} onChange={(evento) => { setFiltroEstado(evento.target.value); setPagina(1) }}>
              <option value="todos">Todos</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option>
            </select>
          </label>
        </div>
        <Table columns={columnas} data={clientesPagina} emptyMessage="No encontramos clientes con esos criterios." emptyIcon="👥" />
        {clientesFiltrados.length > 0 && <footer className="novasalud-clientes-paginacion">
          <span>Mostrando {(paginaActual - 1) * CLIENTES_POR_PAGINA + 1}–{Math.min(paginaActual * CLIENTES_POR_PAGINA, clientesFiltrados.length)} de {clientesFiltrados.length}</span>
          <div>
            <button type="button" aria-label="Página anterior" disabled={paginaActual <= 1} onClick={() => setPagina((actual) => Math.max(1, Math.min(actual, paginas) - 1))}>←</button>
            <span>Página {paginaActual} de {paginas}</span>
            <button type="button" aria-label="Página siguiente" disabled={paginaActual >= paginas} onClick={() => setPagina((actual) => Math.min(paginas, Math.min(actual, paginas) + 1))}>→</button>
          </div>
        </footer>}
      </section>

      <Modal isOpen={modal === 'formulario'} onClose={() => setModal(null)} title={clienteActivo ? 'Editar cliente' : 'Nuevo cliente'} icon="👤" size="md"
        footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit" form="novasalud-formulario-cliente">{clienteActivo ? 'Guardar cambios' : 'Registrar cliente'}</Button></>}>
        <form id="novasalud-formulario-cliente" className="novasalud-clientes-formulario" onSubmit={guardarCliente} noValidate>
          <div className="novasalud-clientes-campo">
            <label htmlFor="novasalud-cliente-nombre">Nombres o razón social *</label>
            <input id="novasalud-cliente-nombre" autoFocus value={formulario.nombre} onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
              aria-invalid={Boolean(errores.nombre)} aria-describedby={errores.nombre ? 'error-nombre' : undefined} />
            {errores.nombre && <small id="error-nombre">{errores.nombre}</small>}
          </div>
          <div className="novasalud-clientes-campo-doble">
            <div className="novasalud-clientes-campo">
              <label htmlFor="novasalud-cliente-tipo-documento">Tipo de documento *</label>
              <select id="novasalud-cliente-tipo-documento" value={formulario.tipoDocumento} onChange={(evento) => setFormulario({ ...formulario, tipoDocumento: evento.target.value, documento: '' })}>
                <option value="DNI">DNI</option><option value="RUC">RUC</option>
              </select>
            </div>
            <div className="novasalud-clientes-campo">
              <label htmlFor="novasalud-cliente-documento">Número *</label>
              <input id="novasalud-cliente-documento" inputMode="numeric" maxLength={formulario.tipoDocumento === 'DNI' ? 8 : 11}
                value={formulario.documento} onChange={(evento) => setFormulario({ ...formulario, documento: evento.target.value })}
                aria-invalid={Boolean(errores.documento)} aria-describedby={errores.documento ? 'error-documento' : undefined} />
              {errores.documento && <small id="error-documento">{errores.documento}</small>}
            </div>
          </div>
          <div className="novasalud-clientes-campo">
            <label htmlFor="novasalud-cliente-telefono">Celular *</label>
            <input id="novasalud-cliente-telefono" type="tel" inputMode="numeric" maxLength="9" value={formulario.telefono}
              onChange={(evento) => setFormulario({ ...formulario, telefono: evento.target.value })}
              aria-invalid={Boolean(errores.telefono)} aria-describedby={errores.telefono ? 'error-telefono' : undefined} />
            {errores.telefono && <small id="error-telefono">{errores.telefono}</small>}
          </div>
          <div className="novasalud-clientes-campo">
            <label htmlFor="novasalud-cliente-correo">Correo electrónico</label>
            <input id="novasalud-cliente-correo" type="email" value={formulario.correo} onChange={(evento) => setFormulario({ ...formulario, correo: evento.target.value })}
              aria-invalid={Boolean(errores.correo)} aria-describedby={errores.correo ? 'error-correo' : undefined} />
            {errores.correo && <small id="error-correo">{errores.correo}</small>}
          </div>
          <div className="novasalud-clientes-campo">
            <label htmlFor="novasalud-cliente-direccion">Dirección</label>
            <input id="novasalud-cliente-direccion" value={formulario.direccion} onChange={(evento) => setFormulario({ ...formulario, direccion: evento.target.value })} />
          </div>
          {clienteActivo && <div className="novasalud-clientes-campo">
            <label htmlFor="novasalud-cliente-estado">Estado</label>
            <select id="novasalud-cliente-estado" value={formulario.estado} onChange={(evento) => setFormulario({ ...formulario, estado: evento.target.value })}>
              <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
            </select>
          </div>}
        </form>
      </Modal>

      <Modal isOpen={modal === 'detalle'} onClose={() => setModal(null)} title="Detalle del cliente" icon="👤" size="lg">
        {clienteActivo && <div className="novasalud-clientes-detalle">
          <div className="novasalud-clientes-datos">
            <h4>{clienteActivo.nombre} <Badge variant={clienteActivo.estado === 'activo' ? 'success' : 'neutral'}>{clienteActivo.estado}</Badge></h4>
            <p><strong>Documento:</strong> {clienteActivo.tipoDocumento} · {clienteActivo.documento}</p>
            <p><strong>Celular:</strong> {clienteActivo.telefono || 'No registrado'}</p>
            <p><strong>Correo:</strong> {clienteActivo.correo || 'No registrado'}</p>
            <p><strong>Dirección:</strong> {clienteActivo.direccion || 'No registrada'}</p>
            <p><strong>Total gastado:</strong> S/ {gastoCliente.toFixed(2)}</p>
          </div>
          <h4>Historial de compras</h4>
          {comprasCliente.length ? <div className="novasalud-clientes-compras">
            {comprasCliente.map((venta) => <div key={venta.id}>
              <span><strong>{venta.id}</strong><small>{new Date(venta.fecha).toLocaleDateString('es-PE')} · {venta.estado}</small></span>
              <strong>S/ {venta.total.toFixed(2)}</strong>
            </div>)}
          </div> : <p className="novasalud-clientes-sin-compras">Este cliente todavía no tiene compras registradas.</p>}
        </div>}
      </Modal>

      <Modal isOpen={modal === 'eliminar'} onClose={() => setModal(null)} title="Eliminar cliente" icon="⚠️" size="sm"
        footer={<><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button variant="danger" onClick={confirmarEliminar}>Confirmar</Button></>}>
        <p>{ventas.some((venta) => venta.clienteId === clienteActivo?.id)
          ? <>El cliente <strong>{clienteActivo?.nombre}</strong> tiene ventas asociadas. Se desactivará y conservará su historial.</>
          : <>¿Seguro que deseas eliminar a <strong>{clienteActivo?.nombre}</strong>? Esta acción no se puede deshacer.</>}</p>
      </Modal>
    </section>
  )
}
