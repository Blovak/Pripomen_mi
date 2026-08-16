export interface DateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const formatter = (timezone: string) => new Intl.DateTimeFormat('en-CA', {
  timeZone: timezone,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

export function getZonedParts(date: Date, timezone: string): DateParts {
  const values = Object.fromEntries(
    formatter(timezone).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]),
  )
  return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute }
}

export function addCalendarDays(date: Pick<DateParts, 'year' | 'month' | 'day'>, days: number) {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + days, 12))
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() }
}

function timezoneOffsetMs(date: Date, timezone: string) {
  const parts = getZonedParts(date, timezone)
  const renderedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
  return renderedAsUtc - Math.floor(date.getTime() / 60_000) * 60_000
}

export function zonedPartsToDate(parts: DateParts, timezone: string) {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
  let result = new Date(target)
  result = new Date(target - timezoneOffsetMs(result, timezone))
  result = new Date(target - timezoneOffsetMs(result, timezone))
  return result
}

export function toOffsetIso(date: Date, timezone: string) {
  const parts = getZonedParts(date, timezone)
  const offsetMinutes = Math.round(timezoneOffsetMs(date, timezone) / 60_000)
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absolute = Math.abs(offsetMinutes)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:00${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
}

export function dateKey(parts: Pick<DateParts, 'year' | 'month' | 'day'>) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}
