import './EmptyState.css'

export default function EmptyState({ icon = '○', title, description, children }) {
  return (
    <div className="shared-empty-state">
      <div className="shared-empty-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  )
}
