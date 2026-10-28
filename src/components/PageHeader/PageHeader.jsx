import './PageHeader.css'

export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  )
}
