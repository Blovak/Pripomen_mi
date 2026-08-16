import type { Reminder } from '../../models/reminder'

export interface ApiErrorPayload { code: string; message: string }
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiErrorPayload }

export interface ReminderRepository {
  list(status?: Reminder['status']): Promise<Reminder[]>
  get(id: string): Promise<Reminder>
  create(reminder: Reminder, requestId: string): Promise<Reminder>
  update(reminder: Reminder): Promise<Reminder>
  complete(id: string): Promise<Reminder>
  cancel(id: string): Promise<Reminder>
  snooze(id: string, scheduledAt: string): Promise<Reminder>
}
