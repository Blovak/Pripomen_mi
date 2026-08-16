import { useState } from 'react'
import { enableNotifications } from '../services/notifications/firebaseNotifications'
import { reminderManager } from '../services/reminders/reminderManager'

const notificationErrors: Record<string, string> = {
  IOS_INSTALL_REQUIRED: 'Na iPhonu nejdřív přidej aplikaci na plochu a spusť ji z ikony.',
  FIREBASE_NOT_CONFIGURED: 'Firebase zatím není nakonfigurovaný.',
  NOTIFICATION_DENIED: 'Notifikace nejsou povolené. Změň oprávnění v nastavení zařízení.',
  NOTIFICATIONS_UNAVAILABLE: 'Tento prohlížeč notifikace nepodporuje.',
  MESSAGING_UNAVAILABLE: 'Firebase Messaging v tomto prohlížeči není dostupný.',
}

export function SettingsPage() {
  const [voice, setVoice] = useState(localStorage.getItem('voiceEnabled') !== 'false')
  const [token, setToken] = useState(localStorage.getItem('apiToken') ?? '')
  const [notice, setNotice] = useState<string | null>(null)
  const changeVoice = (value: boolean) => { setVoice(value); localStorage.setItem('voiceEnabled', String(value)) }
  const saveToken = async () => {
    localStorage.setItem('apiToken', token.trim()); setNotice('Token je uložený pouze v tomto zařízení.')
    try { const count = await reminderManager.sync(); setNotice(`Nastavení uloženo. Synchronizováno: ${count}.`) } catch { setNotice('Token je uložený, ale připojení k backendu se nezdařilo.') }
  }
  const notifications = async () => {
    setNotice('Připravuji notifikace…')
    try { await enableNotifications(); setNotice('Notifikace jsou povolené a zařízení je zaregistrované.') }
    catch (error) { const code = error instanceof Error ? error.message : ''; setNotice(notificationErrors[code] ?? 'Notifikace se nepodařilo zapnout.') }
  }
  return (
    <section className="page">
      <div className="eyebrow">Aplikace</div><h1>Nastavení</h1>
      <label className="setting-row"><span><strong>Hlasová odezva</strong><small>Aplikace přečte otázky a potvrzení.</small></span><input type="checkbox" checked={voice} onChange={(event) => changeVoice(event.target.checked)} /></label>
      <label className="setting-field">Časové pásmo<input value="Europe/Prague" readOnly /></label>
      <label className="setting-field secret-field">Osobní API token<input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Token z Apps Scriptu" /></label>
      <button type="button" className="outline-button" onClick={saveToken}>Uložit a synchronizovat</button>
      <button type="button" className="wide-button" onClick={notifications}>Povolit notifikace</button>
      {notice && <div className="notice" role="status">{notice}</div>}
      <p className="fine-print">O povolení požádáme až po klepnutí. Na iPhonu musí být aplikace nejprve přidaná na plochu.</p>
    </section>
  )
}
