import { useEffect, useMemo, useState } from 'react'
import Badge from '../../components/Badge/Badge'
import EmptyState from '../../components/EmptyState/EmptyState'
import PageHeader from '../../components/PageHeader/PageHeader'
import SearchBar from '../../components/SearchBar/SearchBar'
import Table from '../../components/Table/Table'
import { clientesService } from '../../services'
import { mensajeDeError } from '../../utils/errores'
import './Clientes.css'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [query, setQuery] = useState('')
  const [state, setState] = useState({ loading: true, error: '' })

  const load = () => {
    setState((current) => ({ ...current, loading: true }))
    clientesService.listar(query).then((data) => {
      setClientes(data)
      setState((current) => ({ ...current, loading: false, error: '' }))
    }).catch((error) => setState((current) => ({ ...current, loading: false, error: mensajeDeError(error) })))
  }

  useEffect(() => { load() }, [query])

  const columns = useMemo(() => [
    { header: 'Tipo', key: 'tipo_doc', render: (tipo) => <Badge variant={tipo === 'RUC' ? 'primary' : 'neutral'}>{tipo}</Badge> },
    { header: 'Número de documento', key: 'numero_doc' },
    { header: 'Nombre del cliente', key: 'nombre', render: (nombre) => <strong>{nombre}</strong> }
  ], [])

  return (
    <div className="clientes-page">
      <PageHeader title="Clientes" subtitle="Consulta el directorio de clientes." />
      {state.error && <div className="clientes-feedback error" role="alert">{state.error}</div>}
      <div className="clientes-layout">
        <section className="shared-card clientes-list-card">
          <div className="clientes-list-header">
            <div>
              <h2>Directorio de clientes</h2>
              <p>{clientes.length} clientes registrados</p>
            </div>
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre o documento..."
            showScannerBadge={false}
            autoFocus={false}
          />
          {state.loading ? <div className="clientes-loading">Cargando clientes...</div> : clientes.length === 0 ? (
            <EmptyState icon="⌕" title="No se encontraron clientes" />
          ) : (
            <Table columns={columns} data={clientes} emptyMessage="No se encontraron clientes" className="clientes-table" />
          )}
        </section>
      </div>
    </div>
  )
}
