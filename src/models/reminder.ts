export type ReminderStatus = 'ACTIVE' | 'SENT' | 'DONE' | 'CANCELLED'
export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

export interface Reminder {
  id: string
  userId: string
  title: string
  originalText: string
  scheduledAt: string
  timezone: string
  status: ReminderStatus
  recurrenceType: RecurrenceType
  recurrenceValue: string | null
  createdAt: string
  updatedAt: string
  notifiedAt: string | null
  completedAt: string | null
  snoozeCount: number
}

export interface AppSettings {
  userId: string
  timezone: string
  voiceEnabled: boolean
  defaultMorningTime: string
  defaultAfternoonTime: string
  defaultEveningTime: string
  defaultSnoozeMinutes: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  userId: 'personal',
  timezone: 'Europe/Prague',
  voiceEnabled: true,
  defaultMorningTime: '08:00',
  defaultAfternoonTime: '15:00',
  defaultEveningTime: '19:00',
  defaultSnoozeMinutes: 10,
}
