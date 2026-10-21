import './Table.css'

/**
 * Componente Table: Tabla reusable para Inventario, POS, Clientes y Reportes.
 * Soporta columnas configurables, estado de carga y estado vacío según Paso 12 de trabajoPlan.pdf.
 */
export default function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No se encontraron registros en el sistema',
  emptyIcon = '📋',
  renderFooter,
  className = ''
}) {
  return (
    <div className={`novasalud-table-container ${className}`}>
      <div className="table-responsive-wrapper">
        <table className="novasalud-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={col.key || index}
                  style={{
                    width: col.width || 'auto',
                    textAlign: col.align || 'left'
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length || 1}>
                  <div className="table-loading-container">
                    <div className="table-loading-spinner" />
                    <span>Cargando datos del inventario...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1}>
                  <div className="table-empty-container">
                    <div className="table-empty-icon">{emptyIcon}</div>
                    <h4 className="table-empty-title">Sin resultados</h4>
                    <p className="table-empty-desc">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id || row.codigo || rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.key || colIndex}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render
                        ? col.render(row[col.key], row, rowIndex)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderFooter && (
        <div className="table-footer-bar">
          {renderFooter(data)}
        </div>
      )}
    </div>
  )
}
