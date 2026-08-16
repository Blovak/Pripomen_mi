import type { Reminder } from '../models/reminder'

const at = (dayOffset: number, hour: number, minute = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const mockReminders: Reminder[] = [
  {
    id: 'mock-1', userId: 'personal', title: 'Zavolat Petrovi',
    originalText: 'zítra v devět zavolat Petrovi', scheduledAt: at(1, 9),
    timezone: 'Europe/Prague', status: 'ACTIVE', recurrenceType: 'NONE',
    recurrenceValue: null, createdAt: at(0, 8), updatedAt: at(0, 8),
    notifiedAt: null, completedAt: null, snoozeCount: 0,
  },
  {
    id: 'mock-2', userId: 'personal', title: 'Koupit dálniční známku',
    originalText: 'v pátek ráno koupit dálniční známku', scheduledAt: at(4, 8),
    timezone: 'Europe/Prague', status: 'ACTIVE', recurrenceType: 'NONE',
    recurrenceValue: null, createdAt: at(0, 8), updatedAt: at(0, 8),
    notifiedAt: null, completedAt: null, snoozeCount: 0,
  },
]
