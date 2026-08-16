/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload: { notification?: NotificationOptions & { title?: string; body?: string }; data?: Record<string, string> } = {}
  try { payload = event.data.json() } catch { payload = { notification: { body: event.data.text() } } }
  const notification = payload.notification ?? {}
  const reminderId = payload.data?.reminderId ?? ''
  const title = notification.title ?? 'Připomínka'
  const options = {
    body: notification.body ?? 'Je čas na tvoji připomínku.',
    icon: '/Pripomen_mi/icon-192.png', badge: '/Pripomen_mi/icon-192.png',
    tag: reminderId ? `reminder-${reminderId}` : 'reminder',
    data: { reminderId, clickUrl: payload.data?.clickUrl ?? '/Pripomen_mi/' },
    actions: [
      { action: 'done', title: 'Hotovo' },
      { action: 'snooze-10', title: 'Za 10 minut' },
    ],
  } as NotificationOptions
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data as { reminderId?: string; clickUrl?: string } | undefined
  const route = data?.reminderId ? `/Pripomen_mi/reminders/${data.reminderId}` : (data?.clickUrl ?? '/Pripomen_mi/')
  const action = event.action ? `?notificationAction=${encodeURIComponent(event.action)}` : ''
  event.waitUntil(self.clients.openWindow(route + action))
})
