import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MicrophoneButton } from '../components/MicrophoneButton'
import { useReminders } from '../context/RemindersContext'
import type { Reminder } from '../models/reminder'
import { ApiError } from '../services/api/appsScriptApi'
import { BrowserSpeechRecognitionService } from '../services/speech/speechRecognition'
import { speak } from '../services/speech/textToSpeech'
import { ConversationEngine, type ConversationSnapshot } from '../state/conversationEngine'

const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

export function HomePage() {
  const engine = useRef(new ConversationEngine({ timezone: 'Europe/Prague' }))
  const speech = useMemo(() => new BrowserSpeechRecognitionService(), [])
  const { create, offline } = useReminders()
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [text, setText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [conversation, setConversation] = useState<ConversationSnapshot>(engine.current.value)
  const [error, setError] = useState<string | null>(null)

  const save = async (draft: NonNullable<ConversationSnapshot['draft']>) => {
    if (!draft.title || !draft.dateTime) return
    if (new Date(draft.dateTime).getTime() <= Date.now()) {
      setConversation(engine.current.reset())
      setProcessing(false)
      setError('Připomínka je v minulosti. Řekni prosím celý požadavek s novým časem.')
      speak('Zadaný čas už uplynul. Řekni prosím nový čas.')
      return
    }
    const now = new Date().toISOString()
    const reminder: Reminder = {
      id: newId(), userId: 'personal', title: draft.title, originalText: draft.originalText,
      scheduledAt: draft.dateTime, timezone: 'Europe/Prague', status: 'ACTIVE',
      recurrenceType: draft.recurrence?.type ?? 'NONE', recurrenceValue: draft.recurrence?.value ?? null,
      createdAt: now, updatedAt: now, notifiedAt: null, completedAt: null, snoozeCount: 0,
    }
    setConversation(engine.current.confirm()); setProcessing(true); setError(null)
    try {
      await create(reminder)
      speak(`Dobře. Připomenu ti ${draft.title}.`)
      setConversation(engine.current.reset())
      setTranscript('')
    } catch (reason) {
      setConversation(engine.current.reset())
      setError(reason instanceof ApiError && reason.code === 'DUPLICATE_REMINDER'
        ? 'Stejná připomínka už existuje.' : 'Připomínku se nepodařilo uložit. Zkus to prosím znovu.')
    }
    finally { setProcessing(false) }
  }

  const acceptText = (value: string) => {
    const clean = value.trim()
    if (!clean) return
    setProcessing(true); setTranscript(clean); setError(null)
    const next = conversation.draft ? engine.current.answer(clean) : engine.current.start(clean)
    setText('')
    if (next.state === 'WAITING_FOR_CONFIRMATION' && next.draft) {
      void save(next.draft)
      return
    }
    setConversation(next); setProcessing(false)
    if (next.prompt) speak(next.prompt)
  }

  const listen = async () => {
    if (listening) { speech.stop(); setListening(false); return }
    if (!speech.available) { setError('Rozpoznávání řeči tu není dostupné. Připomínku prosím napiš.'); return }
    setListening(true); setError(null)
    try { acceptText(await speech.listen()) }
    catch (reason) {
      setError(reason instanceof Error && reason.message === 'MICROPHONE_DENIED'
        ? 'Mikrofon není povolený. Povol ho v nastavení Safari, nebo připomínku napiš.'
        : 'Řeči se nepodařilo porozumět. Zkus to znovu nebo připomínku napiš.')
    } finally { setListening(false) }
  }

  const canInput = !processing && conversation.state !== 'SAVING' && conversation.state !== 'DONE'
  const status = listening ? 'Poslouchám…' : processing ? 'Zpracovávám…'
    : conversation.state.startsWith('WAITING_FOR_') ? 'Čekám na doplnění…' : conversation.state === 'DONE' ? 'Hotovo' : 'Připraveno'

  return (
    <section className="voice-page">
      {offline && <div className="offline-pill">Offline · připomínka se odešle později</div>}
      <div className="eyebrow">{status}</div>
      <h1>{conversation.state === 'SAVING' ? 'Ukládám připomínku…'
        : conversation.prompt ?? (conversation.state === 'DONE' ? 'Připomínka je uložená' : 'Co ti mám připomenout?')}</h1>
      {!conversation.draft && <p className="hint">Třeba „Zítra v devět zavolat Petrovi.“</p>}
      {transcript && <blockquote className="transcript">„{transcript}“</blockquote>}
      {canInput && <MicrophoneButton listening={listening} onClick={listen} />}
      {error && <div className="error-message" role="alert">{error}</div>}
      {canInput && (
        <form className="manual-input" onSubmit={(event) => { event.preventDefault(); acceptText(text) }}>
          <label htmlFor="reminder-text">Nebo odpověď napiš</label>
          <div className="input-row">
            <input id="reminder-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Za dvě hodiny vypnout troubu" />
            <button type="submit" disabled={!text.trim()}>Pokračovat</button>
          </div>
        </form>
      )}
      <Link className="secondary-link" to="/reminders">Moje připomínky</Link>
    </section>
  )
}
