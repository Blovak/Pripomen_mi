import { parseCzechReminder } from '../parser/czechReminderParser'
import type { ParsedReminder, ParserOptions } from '../parser/types'
import { toOffsetIso, zonedPartsToDate } from '../utils/zonedDate'

export type ConversationState =
  | 'IDLE' | 'LISTENING' | 'PARSING' | 'WAITING_FOR_TITLE' | 'WAITING_FOR_DATE'
  | 'WAITING_FOR_TIME' | 'WAITING_FOR_CONFIRMATION' | 'SAVING' | 'DONE' | 'ERROR'

export interface ConversationSnapshot {
  state: ConversationState
  draft: ParsedReminder | null
  prompt: string | null
}

function nextState(draft: ParsedReminder): Pick<ConversationSnapshot, 'state' | 'prompt'> {
  if (draft.missingFields.includes('TITLE')) return { state: 'WAITING_FOR_TITLE', prompt: 'Co ti mám připomenout?' }
  if (draft.missingFields.includes('DATE')) return { state: 'WAITING_FOR_DATE', prompt: 'Kdy ti to mám připomenout?' }
  if (draft.missingFields.includes('TIME')) return { state: 'WAITING_FOR_TIME', prompt: 'V kolik hodin?' }
  return { state: 'WAITING_FOR_CONFIRMATION', prompt: 'Mám připomínku uložit?' }
}

export class ConversationEngine {
  private snapshot: ConversationSnapshot = { state: 'IDLE', draft: null, prompt: null }
  constructor(private readonly options: ParserOptions = {}) {}

  get value() { return this.snapshot }

  start(text: string) {
    const draft = parseCzechReminder(text, this.options)
    this.snapshot = { draft, ...nextState(draft) }
    return this.snapshot
  }

  answer(text: string) {
    if (!this.snapshot.draft) return this.start(text)
    const previous = this.snapshot.draft
    const partial = parseCzechReminder(text, this.options)
    const waitingForTitle = this.snapshot.state === 'WAITING_FOR_TITLE'
    const title = waitingForTitle ? partial.title : previous.title
    const date = previous.date ?? partial.date
    const time = previous.time ?? partial.time
    const timezone = this.options.timezone ?? 'Europe/Prague'
    let dateTime: string | null = null
    if (date && time) {
      const [year, month, day] = date.split('-').map(Number)
      const [hour, minute] = time.split(':').map(Number)
      dateTime = toOffsetIso(zonedPartsToDate({ year, month, day, hour, minute }, timezone), timezone)
    }
    const missingFields: ParsedReminder['missingFields'] = []
    if (!title) missingFields.push('TITLE')
    if (!date) missingFields.push('DATE')
    if (!time) missingFields.push('TIME')
    const draft: ParsedReminder = {
      ...previous, title, date, time, dateTime, missingFields,
      recurrence: previous.recurrence ?? partial.recurrence,
      originalText: `${previous.originalText} | ${text}`,
    }
    this.snapshot = { draft, ...nextState(draft) }
    return this.snapshot
  }

  confirm() {
    if (this.snapshot.state !== 'WAITING_FOR_CONFIRMATION') return this.snapshot
    this.snapshot = { ...this.snapshot, state: 'SAVING', prompt: null }
    return this.snapshot
  }

  done() {
    this.snapshot = { ...this.snapshot, state: 'DONE', prompt: 'Hotovo. Připomínka je uložená.' }
    return this.snapshot
  }

  reset() {
    this.snapshot = { state: 'IDLE', draft: null, prompt: null }
    return this.snapshot
  }
}
