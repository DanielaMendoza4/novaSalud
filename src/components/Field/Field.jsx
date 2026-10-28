import './Field.css'

export default function Field({ id, label, error, children, hint }) {
  return (
    <div className="shared-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <small className="shared-field-error" role="alert">{error}</small> : hint && <small className="shared-field-hint">{hint}</small>}
    </div>
  )
}
