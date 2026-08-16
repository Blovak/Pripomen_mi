import { openDB, type DBSchema } from 'idb'
import type { Reminder } from '../../models/reminder'

export interface PendingOperation {
  id: string
  kind: 'create' | 'update' | 'complete' | 'cancel' | 'snooze'
  reminderId: string
  payload: unknown
  createdAt: string
  attempts: number
}

interface ReminderDb extends DBSchema {
  reminders: { key: string; value: Reminder; indexes: { 'by-scheduledAt': string } }
  pending: { key: string; value: PendingOperation; indexes: { 'by-createdAt': string } }
  settings: { key: string; value: { key: string; value: unknown } }
}

const database = openDB<ReminderDb>('pripomen-mi', 1, {
  upgrade(db) {
    const reminders = db.createObjectStore('reminders', { keyPath: 'id' })
    reminders.createIndex('by-scheduledAt', 'scheduledAt')
    const pending = db.createObjectStore('pending', { keyPath: 'id' })
    pending.createIndex('by-createdAt', 'createdAt')
    db.createObjectStore('settings', { keyPath: 'key' })
  },
})

export async function putReminder(reminder: Reminder) { return (await database).put('reminders', reminder) }
export async function getReminder(id: string) { return (await database).get('reminders', id) }
export async function getAllReminders() { return (await database).getAllFromIndex('reminders', 'by-scheduledAt') }
export async function deleteReminder(id: string) { return (await database).delete('reminders', id) }
export async function putPending(operation: PendingOperation) { return (await database).put('pending', operation) }
export async function getAllPending() { return (await database).getAllFromIndex('pending', 'by-createdAt') }
export async function deletePending(id: string) { return (await database).delete('pending', id) }
export async function setSetting<T>(key: string, value: T) { return (await database).put('settings', { key, value }) }
export async function getSetting<T>(key: string) {
  const item = await (await database).get('settings', key)
  return item?.value as T | undefined
}
