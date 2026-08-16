import { Link } from 'react-router-dom'
import { useReminders } from '../context/RemindersContext'
import type { Reminder } from '../models/reminder'

function dayKey(value: Date) { return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}` }

export function RemindersPage() {
  const { reminders, loading } = useReminders()
  const now = new Date(); const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  const active = reminders.filter((item) => item.status === 'ACTIVE' || item.status === 'SENT')
  const groups: [string, Reminder[]][] = [
    ['Dnes', active.filter((item) => dayKey(new Date(item.scheduledAt)) === dayKey(now))],
    ['Zítra', active.filter((item) => dayKey(new Date(item.scheduledAt)) === dayKey(tomorrow))],
    ['Později', active.filter((item) => ![dayKey(now), dayKey(tomorrow)].includes(dayKey(new Date(item.scheduledAt))))],
    ['Hotové', reminders.filter((item) => item.status === 'DONE')],
  ]
  return (
    <section className="page">
      <div className="eyebrow">Přehled</div><h1>Moje připomínky</h1>
      {loading ? <p className="empty-state">Načítám…</p> : groups.map(([label, items]) => (
        <div key={label}><h2>{label}</h2>
          {items.length ? <div className="reminder-list">{items.map((reminder) => (
            <Link className={`reminder-card ${reminder.status === 'DONE' ? 'is-done' : ''}`} to={`/reminders/${reminder.id}`} key={reminder.id}>
              <span className="reminder-time">{new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' }).format(new Date(reminder.scheduledAt))}</span>
              <span><strong>{reminder.title}</strong><small>{new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'medium' }).format(new Date(reminder.scheduledAt))}</small></span><span>›</span>
            </Link>
          ))}</div> : <p className="empty-state">Zatím tu nic není.</p>}
        </div>
      ))}
    </section>
  )
}
