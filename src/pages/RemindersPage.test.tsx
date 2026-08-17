import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Reminder } from '../models/reminder'
import { RemindersPage } from './RemindersPage'

const { remindersMock } = vi.hoisted(() => ({ remindersMock: [] as Reminder[] }))

vi.mock('../context/RemindersContext', () => ({
  useReminders: () => ({ reminders: remindersMock, loading: false }),
}))

function reminder(id: string, title: string, scheduledAt: Date, status: Reminder['status'] = 'ACTIVE'): Reminder {
  return {
    id, title, scheduledAt: scheduledAt.toISOString(), status, userId: 'personal', originalText: title,
    timezone: 'Europe/Prague', recurrenceType: 'NONE', recurrenceValue: null,
    createdAt: scheduledAt.toISOString(), updatedAt: scheduledAt.toISOString(),
    notifiedAt: status === 'SENT' ? scheduledAt.toISOString() : null, completedAt: null, snoozeCount: 0,
  }
}

describe('RemindersPage', () => {
  it('řadí připomínky podle aktivace a označí ty s odeslanou notifikací', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    remindersMock.splice(0, remindersMock.length,
      reminder('late', 'Večerní připomínka', new Date(tomorrow.getTime() + 18 * 60 * 60_000)),
      reminder('sent', 'Odeslaná připomínka', new Date(tomorrow.getTime() + 12 * 60 * 60_000), 'SENT'),
      reminder('early', 'Ranní připomínka', new Date(tomorrow.getTime() + 8 * 60 * 60_000)),
    )

    render(<MemoryRouter><RemindersPage /></MemoryRouter>)

    const tomorrowSection = screen.getByRole('heading', { name: 'Zítra' }).parentElement!
    const cards = within(tomorrowSection).getAllByRole('link')
    expect(cards.map((card) => within(card).getByRole('strong').textContent)).toEqual([
      'Ranní připomínka', 'Odeslaná připomínka', 'Večerní připomínka',
    ])
    const sentCard = screen.getByRole('link', { name: /Odeslaná připomínka/ })
    expect(sentCard.classList.contains('is-notified')).toBe(true)
    expect(within(sentCard).getByLabelText('Notifikace odeslána').textContent).toContain('Odesláno')
    expect(screen.getByRole('link', { name: /Ranní připomínka/ }).classList.contains('is-notified')).toBe(false)
  })
})
