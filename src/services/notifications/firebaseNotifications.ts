import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { appsScriptApi } from '../reminders/reminderManager'

const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isIosHomeScreen() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && standalone
}

export async function enableNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) throw new Error('NOTIFICATIONS_UNAVAILABLE')
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !isIosHomeScreen()) throw new Error('IOS_INSTALL_REQUIRED')
  if (!config.apiKey || !config.projectId || !import.meta.env.VITE_FIREBASE_VAPID_KEY) throw new Error('FIREBASE_NOT_CONFIGURED')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('NOTIFICATION_DENIED')
  if (!(await isSupported())) throw new Error('MESSAGING_UNAVAILABLE')
  const registration = await navigator.serviceWorker.ready
  const messaging = getMessaging(initializeApp(config))
  const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration })
  if (!token) throw new Error('FCM_TOKEN_FAILED')
  await appsScriptApi.call('registerDevice', {
    device: { userId: 'personal', fcmToken: token, platform: navigator.platform || 'web', userAgent: navigator.userAgent },
  })
  return token
}
