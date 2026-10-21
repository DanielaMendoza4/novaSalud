import { useRef, useEffect } from 'react'
import './SearchBar.css'

/**
 * Componente SearchBar: Buscador enfocado con soporte para lector de código de barras.
 * Guiado por trabajoPlan.pdf (Paso 9: "Buscador siempre enfocado para usar lector de código de barras").
 */
export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Buscar medicamento por nombre o escanear código de barras...',
  autoFocus = true,
  showScannerBadge = true,
  className = ''
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (onSearch) onSearch(value)
    }
  }

  return (
    <div className={`novasalud-searchbar ${className}`}>
      <svg
        className="searchbar-icon-left"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        ref={inputRef}
        type="text"
        className="searchbar-input"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />

      <div className="searchbar-right-controls">
        {value && (
          <button
            type="button"
            className="searchbar-clear-btn"
            onClick={() => {
              if (onChange) onChange('')
              inputRef.current?.focus()
            }}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
        {showScannerBadge && (
          <span className="searchbar-scanner-badge" title="Listo para escanear código de barras">
            Lector POS
          </span>
        )}
      </div>
    </div>
  )
}
