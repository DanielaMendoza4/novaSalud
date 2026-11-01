import { useEffect, useRef, useState } from 'react'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO']

const pad = (value) => String(value).padStart(2, '0')

const parseISO = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return valid ? date : null
}

const toISO = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1)
const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const formatDisplay = (value) => {
  const date = parseISO(value)
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : ''
}

const formatLong = (date) => `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`

const buildMonthDays = (month) => {
  const first = startOfMonth(month)
  const offset = (first.getDay() + 6) % 7
  const start = addDays(first, -offset)
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

export default function DateRangePicker({ desde, hasta, max, onChange }) {
  const [openField, setOpenField] = useState(null)
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseISO(max) || new Date()))
  const [focusDate, setFocusDate] = useState(() => max || toISO(new Date()))

  const containerRef = useRef(null)
  const calendarRef = useRef(null)
  const desdeTriggerRef = useRef(null)
  const hastaTriggerRef = useRef(null)

  const valueFor = (field) => (field === 'desde' ? desde : hasta)
  const triggerFor = (field) => (field === 'desde' ? desdeTriggerRef : hastaTriggerRef)

  const upperLimit = (field) => {
    if (field === 'desde' && hasta && max) return hasta < max ? hasta : max
    return max
  }

  const isDisabled = (field, iso) => {
    const upper = upperLimit(field)
    if (upper && iso > upper) return true
    return Boolean(field === 'hasta' && desde && iso < desde)
  }

  const openPicker = (field) => {
    if (openField === field) {
      setOpenField(null)
      return
    }
    const base = parseISO(valueFor(field)) || parseISO(max) || viewMonth
    setViewMonth(startOfMonth(base))
    setFocusDate(toISO(base))
    setOpenField(field)
  }

  const closeAndFocus = () => {
    const trigger = triggerFor(openField)
    setOpenField(null)
    trigger.current?.focus()
  }

  const selectDate = (iso) => {
    if (!openField || isDisabled(openField, iso)) return
    const trigger = triggerFor(openField)
    onChange(openField, iso)
    setOpenField(null)
    trigger.current?.focus()
  }

  const clearDate = () => {
    if (!openField) return
    const trigger = triggerFor(openField)
    onChange(openField, '')
    setOpenField(null)
    trigger.current?.focus()
  }

  const selectToday = () => {
    if (!openField || !max || isDisabled(openField, max)) return
    selectDate(max)
  }

  const changeMonth = (amount) => {
    if (!openField) return
    const nextMonth = addMonths(viewMonth, amount)
    const current = parseISO(focusDate) || parseISO(max) || viewMonth
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()
    let nextDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(current.getDate(), lastDay))
    const upper = parseISO(upperLimit(openField))
    const lower = openField === 'hasta' ? parseISO(desde) : null
    if (upper && nextDate > upper) nextDate = upper
    if (lower && nextDate < lower) nextDate = lower
    setViewMonth(nextMonth)
    setFocusDate(toISO(nextDate))
  }

  const handleCalendarKeyDown = (event) => {
    if (!openField || !event.target?.dataset?.date) return
    const current = parseISO(event.target.dataset.date)
    if (!current) return

    let next = null
    if (event.key === 'ArrowLeft') next = addDays(current, -1)
    else if (event.key === 'ArrowRight') next = addDays(current, 1)
    else if (event.key === 'ArrowUp') next = addDays(current, -7)
    else if (event.key === 'ArrowDown') next = addDays(current, 7)
    else if (event.key === 'Home') next = addDays(current, -((current.getDay() + 6) % 7))
    else if (event.key === 'End') next = addDays(current, 6 - ((current.getDay() + 6) % 7))
    if (!next) return

    event.preventDefault()
    setViewMonth(startOfMonth(next))
    setFocusDate(toISO(next))
  }

  useEffect(() => {
    if (!openField) return
    const target = calendarRef.current?.querySelector(`[data-date="${focusDate}"]`)
    target?.focus()
  }, [openField, focusDate, viewMonth])

  useEffect(() => {
    if (!openField) return
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpenField(null)
    }
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeAndFocus()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  })

  const days = buildMonthDays(viewMonth)
  const monthLabel = `${MONTHS[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`
  const nextMonthFirst = addMonths(viewMonth, 1)
  const limit = openField ? parseISO(upperLimit(openField)) : null
  const nextDisabled = Boolean(limit && nextMonthFirst > limit)
  const previousDisabled = Boolean(openField === 'hasta' && desde && new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0) < parseISO(desde))
  const todayDisabled = Boolean(openField && (!max || isDisabled(openField, max)))

  const renderCalendar = (field) => {
    const label = field === 'desde' ? 'Desde' : 'Hasta'
    const selected = valueFor(field)
    return (
      <div
        id={`reportes-calendar-${field}`}
        className="reportes-date-popover"
        role="dialog"
        aria-label={`Calendario ${label}`}
        ref={calendarRef}
        onKeyDown={handleCalendarKeyDown}
      >
        <div className="reportes-calendar-header">
          <button type="button" className="reportes-calendar-nav" aria-label="Mes anterior" onClick={() => changeMonth(-1)} disabled={previousDisabled}>‹</button>
          <strong aria-live="polite">{monthLabel}</strong>
          <button type="button" className="reportes-calendar-nav" aria-label="Mes siguiente" onClick={() => changeMonth(1)} disabled={nextDisabled}>›</button>
        </div>
        <div className="reportes-calendar-weekdays" aria-hidden="true">
          {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="reportes-calendar-days">
          {days.map((date) => {
            const iso = toISO(date)
            const disabled = isDisabled(field, iso)
            const isSelected = selected === iso
            const isToday = iso === max
            const isOutside = date.getMonth() !== viewMonth.getMonth()
            const className = `reportes-calendar-day${isOutside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`
            return (
              <button
                key={iso}
                type="button"
                className={className}
                data-date={iso}
                tabIndex={iso === focusDate ? 0 : -1}
                aria-label={`${formatLong(date)}${isToday ? ' (hoy)' : ''}`}
                aria-current={isToday ? 'date' : undefined}
                aria-pressed={isSelected}
                aria-disabled={disabled || undefined}
                onClick={() => selectDate(iso)}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
        <div className="reportes-calendar-footer">
          <button type="button" onClick={clearDate}>Borrar</button>
          <button type="button" className="reportes-calendar-today" onClick={selectToday} disabled={todayDisabled}>Hoy</button>
        </div>
      </div>
    )
  }

  const renderField = (field) => {
    const label = field === 'desde' ? 'Desde' : 'Hasta'
    const value = valueFor(field)
    const display = formatDisplay(value)
    const open = openField === field
    return (
      <div className="reportes-date-picker" key={field}>
        <div className="reportes-date-field">
          <span className="reportes-date-label">{label}</span>
          <div className="reportes-date-control">
            <button
              ref={triggerFor(field)}
              type="button"
              className={`reportes-date-trigger${open ? ' is-open' : ''}${display ? '' : ' is-empty'}`}
              aria-label={`${label}: ${display || 'sin fecha'}`}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? `reportes-calendar-${field}` : undefined}
              onClick={() => openPicker(field)}
            >
              <span>{display || 'dd/mm/aaaa'}</span>
              <span className="reportes-date-chevron" aria-hidden="true">▾</span>
            </button>
            {open && renderCalendar(field)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reportes-date-inputs" ref={containerRef}>
      {renderField('desde')}
      {renderField('hasta')}
    </div>
  )
}
