import type { Reminder } from '../../models/reminder'
import type { ApiResponse, ReminderRepository } from './types'

export class ApiError extends Error {
  constructor(public readonly code: string, message: string) { super(message) }
}

interface ApiOptions {
  baseUrl: string
  apiToken: () => string
  userId?: string
  timeoutMs?: number
}

export class AppsScriptApi implements ReminderRepository {
  private readonly userId: string
  private readonly timeoutMs: number
  constructor(private readonly options: ApiOptions) {
    this.userId = options.userId ?? 'personal'
    this.timeoutMs = options.timeoutMs ?? 12_000
  }

  async call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    if (!this.options.baseUrl) throw new ApiError('API_NOT_CONFIGURED', 'Backend zatím není nastavený.')
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(this.options.baseUrl, {
        method: 'POST',
        // text/plain zachová jednoduchý CORS požadavek bez OPTIONS preflightu.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload, apiToken: this.options.apiToken() }),
        signal: controller.signal,
      })
      if (!response.ok) throw new ApiError('HTTP_ERROR', `Backend odpověděl stavem ${response.status}.`)
      const result = await response.json() as ApiResponse<T>
      if (!result.success) throw new ApiError(result.error.code, result.error.message)
      return result.data
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') throw new ApiError('TIMEOUT', 'Backend neodpověděl včas.')
      throw new ApiError('NETWORK_ERROR', 'K backendu se teď nelze připojit.')
    } finally { window.clearTimeout(timeout) }
  }

  list(status?: Reminder['status']) { return this.call<Reminder[]>('listReminders', { userId: this.userId, status }) }
  get(id: string) { return this.call<Reminder>('getReminder', { id, userId: this.userId }) }
  create(reminder: Reminder, requestId: string) { return this.call<Reminder>('createReminder', { reminder, requestId }) }
  update(reminder: Reminder) { return this.call<Reminder>('updateReminder', { reminder }) }
  complete(id: string) { return this.call<Reminder>('completeReminder', { id, userId: this.userId }) }
  cancel(id: string) { return this.call<Reminder>('cancelReminder', { id, userId: this.userId }) }
  snooze(id: string, scheduledAt: string) { return this.call<Reminder>('snoozeReminder', { id, scheduledAt, userId: this.userId }) }
}
