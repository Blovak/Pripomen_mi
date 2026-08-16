import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useReminders } from '../context/RemindersContext'

export function ReminderDetailPage() {
  const { id } = useParams(); const navigate = useNavigate(); const [params] = useSearchParams()
  const { reminders, complete, cancel, snooze } = useReminders()
  const actionHandled = useRef(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [customTime, setCustomTime] = useState('')
  const reminder = reminders.find((item) => item.id === id)
  useEffect(() => {
    if (!id || actionHandled.current) return
    const action = params.get('notificationAction')
    if (action === 'done') { actionHandled.current = true; void complete(id) }
    if (action === 'snooze-10') { actionHandled.current = true; void snooze(id, 10) }
  }, [complete, id, params, snooze])
  if (!reminder) return <section className="page"><h1>Připomínka nenalezena</h1><Link to="/reminders">Zpět</Link></section>
  const perform = async (action: () => Promise<void>) => { await action(); navigate('/reminders') }
  return (
    <section className="page detail-page">
      <div className="eyebrow">{reminder.status === 'DONE' ? 'Hotovo' : 'Připomínka'}</div><h1>{reminder.title}</h1>
      <p className="date-hero">{new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(reminder.scheduledAt))}</p>
      <div className="action-grid">
        <button type="button" className="primary-action" onClick={() => perform(() => complete(reminder.id))}>Hotovo</button>
        <button type="button" onClick={() => perform(() => snooze(reminder.id, 10))}>Za 10 minut</button>
        <button type="button" onClick={() => perform(() => snooze(reminder.id, 30))}>Za 30 minut</button>
        <button type="button" onClick={() => perform(() => snooze(reminder.id, 60))}>Za hodinu</button>
        <button type="button" onClick={() => setCustomOpen((value) => !value)}>Vlastní čas</button>
        <button type="button" className="danger-action" onClick={() => perform(() => cancel(reminder.id))}>Zrušit</button>
      </div>
      {customOpen && <form className="custom-snooze" onSubmit={(event) => {
        event.preventDefault()
        const at = new Date(customTime)
        if (!Number.isNaN(at.getTime()) && at.getTime() > Date.now()) void perform(() => snooze(reminder.id, Math.ceil((at.getTime() - Date.now()) / 60_000)))
      }}>
        <label htmlFor="custom-time">Nový čas připomínky</label>
        <input id="custom-time" type="datetime-local" value={customTime} onChange={(event) => setCustomTime(event.target.value)} required />
        <button type="submit">Odložit</button>
      </form>}
    </section>
  )
}
