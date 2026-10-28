import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/Button/Button'
import Badge from '../../components/Badge/Badge'
import EmptyState from '../../components/EmptyState/EmptyState'
import Field from '../../components/Field/Field'
import PageHeader from '../../components/PageHeader/PageHeader'
import SearchBar from '../../components/SearchBar/SearchBar'
import Table from '../../components/Table/Table'
import { clientesService } from '../../services'
import { mensajeDeError } from '../../utils/errores'
import './Clientes.css'

const initialForm = { tipo_doc: 'DNI', numero_doc: '', nombre: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(initialForm)
  const [state, setState] = useState({ loading: true, saving: false, error: '', success: '' })
  const maxDocumentLength = form.tipo_doc === 'DNI' ? 8 : 11
  const documentError = form.numero_doc && form.numero_doc.length !== maxDocumentLength
    ? `${form.tipo_doc} debe tener ${maxDocumentLength} dígitos.`
    : ''
  const formValid = form.numero_doc.length === maxDocumentLength && form.nombre.trim().length > 0

  const load = () => {
    setState((current) => ({ ...current, loading: true }))
    clientesService.listar(query).then((data) => {
      setClientes(data)
      setState((current) => ({ ...current, loading: false, error: '' }))
    }).catch((error) => setState((current) => ({ ...current, loading: false, error: mensajeDeError(error) })))
  }

  useEffect(() => { load() }, [query])

  const create = async (event) => {
    event.preventDefault()
    if (!formValid) return
    setState((current) => ({ ...current, saving: true, error: '', success: '' }))
    try {
      const cliente = await clientesService.crear(form)
      setClientes((current) => [...current, cliente])
      setForm(initialForm)
      setState({ loading: false, saving: false, error: '', success: 'Cliente creado correctamente.' })
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.codigo ? `${error.codigo}: ${mensajeDeError(error)}` : mensajeDeError(error), success: '' }))
    }
  }

  const columns = useMemo(() => [
    { header: 'Tipo', key: 'tipo_doc', render: (tipo) => <Badge variant={tipo === 'RUC' ? 'primary' : 'neutral'}>{tipo}</Badge> },
    { header: 'Número de documento', key: 'numero_doc' },
    { header: 'Nombre del cliente', key: 'nombre', render: (nombre) => <strong>{nombre}</strong> }
  ], [])

  return (
    <div className="clientes-page">
      <PageHeader title="Clientes" subtitle="Busca y registra clientes para tus comprobantes." />
      {state.error && <div className="clientes-feedback error" role="alert">{state.error}</div>}
      {state.success && <div className="clientes-feedback success" role="status">{state.success}</div>}
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

        <section className="shared-card clientes-form-card">
          <div className="clientes-form-heading">
            <span className="clientes-form-icon">+</span>
            <div>
              <h2>Nuevo cliente</h2>
              <p>Completa los datos del cliente.</p>
            </div>
          </div>
          <form onSubmit={create} className="clientes-form">
            <Field id="cliente-tipo" label="Tipo de documento">
              <select id="cliente-tipo" value={form.tipo_doc} onChange={(event) => setForm({ ...form, tipo_doc: event.target.value, numero_doc: '' })}>
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
              </select>
            </Field>
            <Field id="cliente-numero" label="Número de documento" error={documentError} hint={`Ingresa ${maxDocumentLength} dígitos.`}>
              <input
                id="cliente-numero"
                inputMode="numeric"
                maxLength={maxDocumentLength}
                value={form.numero_doc}
                aria-invalid={Boolean(documentError)}
                onChange={(event) => setForm({ ...form, numero_doc: event.target.value.replace(/\D/g, '') })}
              />
            </Field>
            <Field id="cliente-nombre" label="Nombre completo">
              <input id="cliente-nombre" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
            </Field>
            <Button type="submit" fullWidth disabled={state.saving || !formValid} loading={state.saving}>
              Crear cliente
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}
