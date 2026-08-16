import { addCalendarDays, dateKey, getZonedParts, toOffsetIso, zonedPartsToDate } from '../utils/zonedDate'
import type { ParsedReminder, ParserOptions } from './types'

const NUMBER_WORDS: Record<string, number> = {
  jeden: 1, jednu: 1, jedna: 1, dvě: 2, dva: 2, tři: 3, čtyři: 4, pět: 5,
  šest: 6, sedm: 7, osm: 8, devět: 9, deset: 10, jedenáct: 11, dvanáct: 12,
  třináct: 13, čtrnáct: 14, patnáct: 15, šestnáct: 16, sedmnáct: 17,
  osmnáct: 18, devatenáct: 19, dvacet: 20, třicet: 30, čtyřicet: 40,
  padesát: 50, šedesát: 60,
}

const WEEKDAYS: Record<string, number> = {
  neděli: 0, neděle: 0, pondělí: 1, úterý: 2, středu: 3, středa: 3,
  čtvrtek: 4, čtvrtka: 4, pátek: 5, sobotu: 6, sobota: 6,
}

const COMMAND_PATTERNS = [
  /(?<!\p{L})prosím(?=$|[^\p{L}])/giu,
  /(?<!\p{L})připomeň(?:te)?(?:\s+mi)?(?=$|[^\p{L}])/giu,
  /(?<!\p{L})ať\s+nezapomenu(?=$|[^\p{L}])/giu,
]

const parseNumber = (value: string) => /^\d+$/.test(value) ? Number(value) : NUMBER_WORDS[value.toLocaleLowerCase('cs-CZ')]
const parseClockNumber = (value: string) => {
  const normalized = value.toLocaleLowerCase('cs-CZ')
  const inflected: Record<string, number> = { jedné: 1, dvou: 2, třech: 3, čtyřech: 4, pěti: 5, šesti: 6, sedmi: 7, osmi: 8, devíti: 9, desíti: 10 }
  return parseNumber(normalized) ?? inflected[normalized]
}

function cleanTitle(input: string, consumed: RegExp[]) {
  let title = input
  for (const pattern of [...COMMAND_PATTERNS, ...consumed]) title = title.replace(pattern, ' ')
  title = title.replace(/^[,.;:!?\s-]+|[,.;:!?\s-]+$/g, '').replace(/\s{2,}/g, ' ')
  if (!title) return null
  return title.charAt(0).toLocaleUpperCase('cs-CZ') + title.slice(1)
}

export function parseCzechReminder(text: string, options: ParserOptions = {}): ParsedReminder {
  const timezone = options.timezone ?? 'Europe/Prague'
  const now = options.now ?? new Date()
  const nowParts = getZonedParts(now, timezone)
  const normalized = text.trim().toLocaleLowerCase('cs-CZ')
  const consumed: RegExp[] = []
  let date: { year: number; month: number; day: number } | null = null
  let time: { hour: number; minute: number } | null = null
  let instant: Date | null = null

  const relative = normalized.match(/\bza\s+(\d+|[\p{L}]+)\s+(minut(?:u|y)?|hodin(?:u|y)?)\b/u)
  if (relative) {
    const amount = parseNumber(relative[1])
    if (Number.isFinite(amount)) {
      const multiplier = relative[2].startsWith('hodin') ? 60 : 1
      instant = new Date(now.getTime() + amount * multiplier * 60_000)
      const parts = getZonedParts(instant, timezone)
      date = { year: parts.year, month: parts.month, day: parts.day }
      time = { hour: parts.hour, minute: parts.minute }
      consumed.push(new RegExp(relative[0], 'giu'))
    }
  }

  if (!date) {
    const relativeDay = normalized.match(/(?<!\p{L})(pozítří|zítra|dnes)(?=$|[^\p{L}])/u)
    if (relativeDay) {
      const offset = relativeDay[1] === 'pozítří' ? 2 : relativeDay[1] === 'zítra' ? 1 : 0
      date = addCalendarDays(nowParts, offset)
      consumed.push(new RegExp(relativeDay[0], 'giu'))
    }
  }

  if (!date) {
    const concrete = normalized.match(/\b(\d{1,2})\.\s*(\d{1,2})\.(?:\s*(\d{4}))?\b/u)
    if (concrete) {
      date = { day: Number(concrete[1]), month: Number(concrete[2]), year: concrete[3] ? Number(concrete[3]) : nowParts.year }
      if (!concrete[3] && zonedPartsToDate({ ...date, hour: 12, minute: 0 }, timezone) < now) date.year += 1
      consumed.push(new RegExp(concrete[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu'))
    }
  }

  if (!date) {
    const weekday = normalized.match(/(?<!\p{L})(?:v\s+)?(příští\s+)?(pondělí|úterý|středu|středa|čtvrtek|čtvrtka|pátek|sobotu|sobota|neděli|neděle)(?=$|[^\p{L}])/u)
    if (weekday) {
      const target = WEEKDAYS[weekday[2]]
      const current = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 12)).getUTCDay()
      let offset = (target - current + 7) % 7
      if (offset === 0 || weekday[1]) offset += 7
      date = addCalendarDays(nowParts, offset)
      consumed.push(new RegExp(weekday[0], 'giu'))
    }
  }

  if (!time) {
    const clock = normalized.match(/\bv\s+(\d{1,2}|[\p{L}]+)(?::|\.)(\d{2})\b/u)
      ?? normalized.match(/\bv\s+(\d{1,2}|[\p{L}]+)(?:\s+hodin(?:u|y)?)?\b/u)
    if (clock) {
      const hour = parseClockNumber(clock[1])
      const minute = clock[2] ? Number(clock[2]) : 0
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        time = { hour, minute }
        consumed.push(new RegExp(clock[0], 'giu'))
      }
    }
  }

  if (!time) {
    const dayPart = normalized.match(/(?<!\p{L})(ráno|dopoledne|odpoledne|večer)(?=$|[^\p{L}])/u)
    if (dayPart) {
      const defaults: Record<string, string> = {
        ráno: options.morningTime ?? '08:00', dopoledne: '10:00',
        odpoledne: options.afternoonTime ?? '15:00', večer: options.eveningTime ?? '19:00',
      }
      const [hour, minute] = defaults[dayPart[1]].split(':').map(Number)
      time = { hour, minute }
      consumed.push(new RegExp(dayPart[0], 'giu'))
    }
  }

  const daily = /\bkaždý\s+den\b/u.exec(normalized)
  const weekly = /\bkažd(?:é|ý)\s+(pondělí|úterý|středu|čtvrtek|pátek|sobotu|neděli)\b/u.exec(normalized)
  const recurrence = daily ? { type: 'DAILY' as const, value: null } : weekly ? { type: 'WEEKLY' as const, value: String(WEEKDAYS[weekly[1]]) } : null
  if (daily) consumed.push(/\bkaždý\s+den\b/giu)
  if (weekly) consumed.push(new RegExp(weekly[0], 'giu'))

  if (!instant && date && time) instant = zonedPartsToDate({ ...date, ...time }, timezone)
  const title = cleanTitle(text, consumed)
  const missingFields: ParsedReminder['missingFields'] = []
  if (!title) missingFields.push('TITLE')
  if (!date) missingFields.push('DATE')
  if (!time) missingFields.push('TIME')

  return {
    title,
    dateTime: instant ? toOffsetIso(instant, timezone) : null,
    recurrence,
    missingFields,
    originalText: text,
    date: date ? dateKey(date) : null,
    time: time ? `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}` : null,
  }
}
