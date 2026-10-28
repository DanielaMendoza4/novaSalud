const LIMA_TIME_ZONE = 'America/Lima'
const LIMA_LOCALE = 'es-PE'

const format = (value, options) => new Intl.DateTimeFormat(LIMA_LOCALE, {
  timeZone: LIMA_TIME_ZONE,
  ...options
}).format(new Date(value))

export const formatFecha = (value) => format(value, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

export const formatHora = (value) => format(value, {
  hour: '2-digit',
  minute: '2-digit'
})

export const formatFechaHora = (value) => format(value, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

export const ahoraEnLima = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date()).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value
    return result
  }, {})

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-05:00`
}
