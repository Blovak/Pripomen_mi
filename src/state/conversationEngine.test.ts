import { describe, expect, it } from 'vitest'
import { ConversationEngine } from './conversationEngine'

const options = { now: new Date('2026-08-16T08:00:00.000Z'), timezone: 'Europe/Prague' }

describe('ConversationEngine', () => {
  it('doplní postupně datum a čas', () => {
    const engine = new ConversationEngine(options)
    expect(engine.start('Připomeň mi zavolat Petrovi').state).toBe('WAITING_FOR_DATE')
    expect(engine.answer('Zítra').state).toBe('WAITING_FOR_TIME')
    const result = engine.answer('V devět')
    expect(result.state).toBe('WAITING_FOR_CONFIRMATION')
    expect(result.draft).toMatchObject({ title: 'Zavolat Petrovi', dateTime: '2026-08-17T09:00:00+02:00' })
  })

  it('přejde rovnou k potvrzení u úplného požadavku', () => {
    const engine = new ConversationEngine(options)
    expect(engine.start('Za dvě hodiny připomeň vypnout troubu').state).toBe('WAITING_FOR_CONFIRMATION')
    expect(engine.confirm().state).toBe('SAVING')
    expect(engine.done().state).toBe('DONE')
  })
})
