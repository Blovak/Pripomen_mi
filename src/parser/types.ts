import type { RecurrenceType } from '../models/reminder'

export type MissingField = 'TITLE' | 'DATE' | 'TIME'

export interface ParsedReminder {
  title: string | null
  dateTime: string | null
  recurrence: { type: RecurrenceType; value: string | null } | null
  missingFields: MissingField[]
  originalText: string
  date: string | null
  time: string | null
}

export interface ParserOptions {
  now?: Date
  timezone?: string
  morningTime?: string
  afternoonTime?: string
  eveningTime?: string
}
