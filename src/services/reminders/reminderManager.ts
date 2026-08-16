import type { Reminder } from '../../models/reminder'
import { AppsScriptApi, ApiError } from '../api/appsScriptApi'
import {
  deletePending, getAllPending, getAllReminders, getReminder, putPending, putReminder,
  type PendingOperation,
} from '../storage/database'

const api = new AppsScriptApi({
  baseUrl: import.meta.env.VITE_APPS_SCRIPT_URL ?? '',
  apiToken: () => localStorage.getItem('apiToken') ?? '',
})

const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

export class ReminderManager {
  get configured() { return Boolean(import.meta.env.VITE_APPS_SCRIPT_URL && localStorage.getItem('apiToken')) }

  async list() {
    const local = await getAllReminders()
    if (!this.configured || !navigator.onLine) return local
    try {
      const remote = await api.list()
      await Promise.all(remote.map(putReminder))
      return remote
    } catch { return local }
  }

  async create(reminder: Reminder) {
    const existing = (await getAllReminders()).find((item) => item.status === 'ACTIVE'
      && item.title.toLocaleLowerCase('cs-CZ') === reminder.title.toLocaleLowerCase('cs-CZ')
      && Math.abs(new Date(item.scheduledAt).getTime() - new Date(reminder.scheduledAt).getTime()) < 60_000)
    if (existing) throw new ApiError('DUPLICATE_REMINDER', 'Stejná připomínka už existuje.')
    await putReminder(reminder)
    const operation: PendingOperation = {
      id: newId(), kind: 'create', reminderId: reminder.id, payload: reminder,
      createdAt: new Date().toISOString(), attempts: 0,
    }
    await putPending(operation)
    if (this.configured && navigator.onLine) await this.sync().catch(() => undefined)
    return reminder
  }

  async complete(id: string) { return this.mutate(id, 'complete') }
  async cancel(id: string) { return this.mutate(id, 'cancel') }
  async snooze(id: string, scheduledAt: string) { return this.mutate(id, 'snooze', { scheduledAt }) }

  private async mutate(id: string, kind: PendingOperation['kind'], payload: Record<string, unknown> = {}) {
    const reminder = await getReminder(id)
    if (!reminder) throw new ApiError('NOT_FOUND', 'Připomínka nebyla nalezena.')
    const now = new Date().toISOString()
    const updated: Reminder = { ...reminder, updatedAt: now }
    if (kind === 'complete') { updated.status = 'DONE'; updated.completedAt = now }
    if (kind === 'cancel') updated.status = 'CANCELLED'
    if (kind === 'snooze') { updated.status = 'ACTIVE'; updated.scheduledAt = String(payload.scheduledAt); updated.notifiedAt = null; updated.snoozeCount += 1 }
    await putReminder(updated)
    await putPending({ id: newId(), kind, reminderId: id, payload, createdAt: now, attempts: 0 })
    if (this.configured && navigator.onLine) await this.sync().catch(() => undefined)
    return updated
  }

  async sync() {
    if (!this.configured || !navigator.onLine) return 0
    const operations = await getAllPending()
    let count = 0
    for (const operation of operations) {
      try {
        let reminder: Reminder
        if (operation.kind === 'create') reminder = await api.create(operation.payload as Reminder, operation.id)
        else if (operation.kind === 'update') reminder = await api.update(operation.payload as Reminder)
        else if (operation.kind === 'complete') reminder = await api.complete(operation.reminderId)
        else if (operation.kind === 'cancel') reminder = await api.cancel(operation.reminderId)
        else reminder = await api.snooze(operation.reminderId, String((operation.payload as { scheduledAt: string }).scheduledAt))
        await putReminder(reminder)
        await deletePending(operation.id)
        count += 1
      } catch (error) {
        if (error instanceof ApiError && ['UNAUTHORIZED', 'INVALID_DATE', 'NOT_FOUND'].includes(error.code)) throw error
        break
      }
    }
    return count
  }
}

export const reminderManager = new ReminderManager()
export { api as appsScriptApi }
