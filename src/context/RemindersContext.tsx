import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import type { Reminder } from '../models/reminder'
import { reminderManager } from '../services/reminders/reminderManager'

interface Value {
  reminders: Reminder[]; loading: boolean; offline: boolean
  refresh(): Promise<void>; create(reminder: Reminder): Promise<void>
  complete(id: string): Promise<void>; cancel(id: string): Promise<void>; snooze(id: string, minutes: number): Promise<void>
}
const Context = createContext<Value | null>(null)

export function RemindersProvider({ children }: PropsWithChildren) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(!navigator.onLine)
  const refresh = useCallback(async () => { setReminders(await reminderManager.list()); setLoading(false) }, [])
  useEffect(() => {
    void reminderManager.sync().finally(refresh)
    const online = () => { setOffline(false); void reminderManager.sync().finally(refresh) }
    const offlineHandler = () => setOffline(true)
    window.addEventListener('online', online); window.addEventListener('offline', offlineHandler)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offlineHandler) }
  }, [refresh])
  const run = async (action: () => Promise<unknown>) => { await action(); await refresh() }
  return <Context.Provider value={{
    reminders, loading, offline, refresh,
    create: (reminder) => run(() => reminderManager.create(reminder)),
    complete: (id) => run(() => reminderManager.complete(id)),
    cancel: (id) => run(() => reminderManager.cancel(id)),
    snooze: (id, minutes) => run(() => reminderManager.snooze(id, new Date(Date.now() + minutes * 60_000).toISOString())),
  }}>{children}</Context.Provider>
}

export function useReminders() {
  const value = useContext(Context)
  if (!value) throw new Error('useReminders musí být uvnitř RemindersProvider')
  return value
}
