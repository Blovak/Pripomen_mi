import { describe, expect, it } from 'vitest'
import { parseCzechReminder } from './czechReminderParser'

const options = { now: new Date('2026-08-16T08:00:00.000Z'), timezone: 'Europe/Prague' }

describe('parseCzechReminder', () => {
  it('parsuje zítra v devět', () => {
    expect(parseCzechReminder('zítra v devět zavolat Petrovi', options)).toMatchObject({
      title: 'Zavolat Petrovi', dateTime: '2026-08-17T09:00:00+02:00', missingFields: [],
    })
  })

  it('parsuje relativních 20 minut', () => {
    expect(parseCzechReminder('za 20 minut vypnout troubu', options)).toMatchObject({
      title: 'Vypnout troubu', dateTime: '2026-08-16T10:20:00+02:00', missingFields: [],
    })
  })

  it('u pátku bez času vyžádá čas', () => {
    expect(parseCzechReminder('v pátek připomeň schůzku', options)).toMatchObject({
      title: 'Schůzku', date: '2026-08-21', time: null, missingFields: ['TIME'],
    })
  })

  it('u samotného úkolu vyžádá datum a čas', () => {
    expect(parseCzechReminder('připomeň mi koupit mléko', options)).toMatchObject({
      title: 'Koupit mléko', dateTime: null, missingFields: ['DATE', 'TIME'],
    })
  })

  it('parsuje pozítří večer', () => {
    expect(parseCzechReminder('pozítří večer zkontrolovat faktury', options)).toMatchObject({
      title: 'Zkontrolovat faktury', dateTime: '2026-08-18T19:00:00+02:00', missingFields: [],
    })
  })

  it('příští pondělí znamená následující týden', () => {
    expect(parseCzechReminder('příští pondělí ráno zavolat účetní', options).dateTime)
      .toBe('2026-08-24T08:00:00+02:00')
  })
})
