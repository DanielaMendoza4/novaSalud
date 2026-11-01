import { useEffect, useMemo, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import EmptyState from '../../components/EmptyState/EmptyState'
import PageHeader from '../../components/PageHeader/PageHeader'
import SearchBar from '../../components/SearchBar/SearchBar'
import Table from '../../components/Table/Table'
import { clientesService } from '../../services'
import { mensajeDeError } from '../../utils/errores'
import './Clientes.css'

const FILTROS = [
  { id: 'todos', label: 'Todos', pie: 'Todos' },
  { id: 'DNI', label: 'Personas · DNI', pie: 'Personas' },
  { id: 'RUC', label: 'Empresas · RUC', pie: 'Empresas' }
]

const DOCUMENTO_OCULTO = '--------'

// Solo un "false" explícito oculta el documento: si el campo no llega, se muestra.
const dniNoRequerido = (cliente) => cliente.dni_requerido === false

const normalizar = (texto) =>
  String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Personas: nombre + último apellido. Empresas: las dos primeras palabras de la razón social.
const obtenerIniciales = ({ nombre, tipo_doc: tipo }) => {
  const palabras = String(nombre ?? '').trim().split(/\s+/).filter(Boolean)
  const segunda = tipo === 'RUC' ? palabras[1] : palabras.at(-1)
  const letras = palabras.length > 1 ? [palabras[0], segunda] : palabras
  return letras.map((palabra) => palabra[0]).join('').toUpperCase()
}

const columnas = [
  {
    header: 'Cliente',
    key: 'nombre',
    width: '40%',
    render: (nombre, cliente) => {
      const esEmpresa = cliente.tipo_doc === 'RUC'
      return (
        <div className="clientes-identidad">
          <span className={`clientes-avatar ${esEmpresa ? 'empresa' : 'persona'}`} aria-hidden="true">
            {obtenerIniciales(cliente)}
          </span>
          <div className="clientes-identidad-texto">
            <strong>{nombre}</strong>
            <small>{esEmpresa ? 'Empresa' : 'Persona natural'}</small>
          </div>
        </div>
      )
    }
  },
  {
    header: 'Tipo',
    key: 'tipo_doc',
    width: '14%',
    render: (tipo) => <Badge variant={tipo === 'RUC' ? 'primary' : 'neutral'}>{tipo}</Badge>
  },
  {
    header: 'DNI requerido',
    key: 'dni_requerido',
    width: '16%',
    render: (_, cliente) => (
      <Badge variant={dniNoRequerido(cliente) ? 'neutral' : 'primary'}>
        {dniNoRequerido(cliente) ? 'No' : 'Sí'}
      </Badge>
    )
  },
  {
    header: 'Número de documento',
    key: 'numero_doc',
    render: (numero, cliente) => (
      <span className="clientes-documento">{dniNoRequerido(cliente) ? DOCUMENTO_OCULTO : numero}</span>
    )
  }
]

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    let cancelado = false
    clientesService.listar()
      .then((data) => {
        if (cancelado) return
        setClientes(data)
        setState({ loading: false, error: '' })
      })
      .catch((error) => {
        if (!cancelado) setState({ loading: false, error: mensajeDeError(error) })
      })
    return () => { cancelado = true }
  }, [])

  const coincidencias = useMemo(() => {
    const busqueda = normalizar(query.trim())
    return clientes.filter((cliente) =>
      normalizar(`${cliente.nombre} ${dniNoRequerido(cliente) ? '' : cliente.numero_doc}`).includes(busqueda)
    )
  }, [clientes, query])

  const conteos = useMemo(() => ({
    todos: coincidencias.length,
    DNI: coincidencias.filter((cliente) => cliente.tipo_doc === 'DNI').length,
    RUC: coincidencias.filter((cliente) => cliente.tipo_doc === 'RUC').length
  }), [coincidencias])

  const visibles = useMemo(
    () => (filtro === 'todos' ? coincidencias : coincidencias.filter((cliente) => cliente.tipo_doc === filtro)),
    [coincidencias, filtro]
  )

  const filtroActivo = FILTROS.find((item) => item.id === filtro)

  const renderContenido = () => {
    if (state.loading) return <div className="clientes-loading">Cargando clientes...</div>
    if (state.error) return null
    if (visibles.length === 0) return <EmptyState icon="⌕" title="No se encontraron clientes" />
    return (
      <Table
        columns={columnas}
        data={visibles}
        className="clientes-table"
        renderFooter={() => (
          <>
            <span>Mostrando {visibles.length} de {clientes.length} clientes</span>
            <span>Filtro: {filtroActivo.pie}</span>
          </>
        )}
      />
    )
  }

  return (
    <div className="clientes-page">
      <PageHeader title="Clientes" subtitle="Consulta el directorio de clientes." />
      {state.error && <div className="clientes-feedback error" role="alert">{state.error}</div>}
      <section className="shared-card clientes-list-card">
        <div className="clientes-list-header">
          <div>
            <h2>Registro de clientes</h2>
            <p>{clientes.length} {clientes.length === 1 ? 'cliente registrado' : 'clientes registrados'}</p>
          </div>
          <div className="clientes-filtros" role="group" aria-label="Filtrar por tipo de cliente">
            {FILTROS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={filtro === id ? 'active' : ''}
                aria-pressed={filtro === id}
                onClick={() => setFiltro(id)}
              >
                {label}
                <span className="clientes-filtro-conteo">{conteos[id]}</span>
              </button>
            ))}
          </div>
        </div>
        <SearchBar
          className="clientes-searchbar"
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nombre o documento..."
          showScannerBadge={false}
          autoFocus={false}
        />
        {renderContenido()}
      </section>
    </div>
  )
}
