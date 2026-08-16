import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [text, setText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [conversation, setConversation] = useState<ConversationSnapshot>(engine.current.value)
  const [error, setError] = useState<string | null>(null)

  const acceptText = (value: string) => {
    const clean = value.trim()
    if (!clean) return
    setProcessing(true); setTranscript(clean); setError(null)
    const next = conversation.draft ? engine.current.answer(clean) : engine.current.start(clean)
    setConversation(next); setText(''); setProcessing(false)
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

  const save = async () => {
    const draft = conversation.draft
    if (!draft?.title || !draft.dateTime) return
    if (new Date(draft.dateTime).getTime() <= Date.now()) { setError('Připomínka je v minulosti. Řekni prosím nový čas.'); return }
    const now = new Date().toISOString()
    const reminder: Reminder = {
      id: newId(), userId: 'personal', title: draft.title, originalText: draft.originalText,
      scheduledAt: draft.dateTime, timezone: 'Europe/Prague', status: 'ACTIVE',
      recurrenceType: draft.recurrence?.type ?? 'NONE', recurrenceValue: draft.recurrence?.value ?? null,
      createdAt: now, updatedAt: now, notifiedAt: null, completedAt: null, snoozeCount: 0,
    }
    setProcessing(true); setError(null)
    try {
      await create(reminder)
      engine.current.confirm(); const done = engine.current.done(); setConversation(done)
      speak(`Dobře. Připomenu ti ${draft.title}.`)
      window.setTimeout(() => navigate(`/reminders/${reminder.id}`), 650)
    } catch (reason) {
      setError(reason instanceof ApiError && reason.code === 'DUPLICATE_REMINDER'
        ? 'Stejná připomínka už existuje.' : 'Připomínku se nepodařilo uložit. Zkus to prosím znovu.')
    }
    finally { setProcessing(false) }
  }

  const reset = () => { setConversation(engine.current.reset()); setTranscript(''); setError(null) }
  const ready = conversation.state === 'WAITING_FOR_CONFIRMATION'
  const status = listening ? 'Poslouchám…' : processing ? 'Zpracovávám…'
    : conversation.state.startsWith('WAITING_FOR_') ? 'Čekám na doplnění…' : conversation.state === 'DONE' ? 'Hotovo' : 'Připraveno'

  return (
    <section className="voice-page">
      {offline && <div className="offline-pill">Offline · připomínka se odešle později</div>}
      <div className="eyebrow">{status}</div>
      <h1>{conversation.prompt ?? (conversation.state === 'DONE' ? 'Připomínka je uložená' : 'Co ti mám připomenout?')}</h1>
      {!conversation.draft && <p className="hint">Třeba „Zítra v devět zavolat Petrovi.“</p>}
      {transcript && <blockquote className="transcript">„{transcript}“</blockquote>}
      {ready && conversation.draft && (
        <div className="confirmation">
          <strong>{conversation.draft.title}</strong>
          <span>{new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(conversation.draft.dateTime!))}</span>
          <button type="button" onClick={save} disabled={processing}>Uložit připomínku</button>
          <button type="button" className="text-button" onClick={reset}>Začít znovu</button>
        </div>
      )}
      {!ready && conversation.state !== 'DONE' && <MicrophoneButton listening={listening} onClick={listen} />}
      {conversation.state === 'DONE' && <button type="button" className="wide-button compact" onClick={reset}>Přidat další</button>}
      {error && <div className="error-message" role="alert">{error}</div>}
      {!ready && conversation.state !== 'DONE' && (
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
