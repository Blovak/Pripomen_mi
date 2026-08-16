export interface SpeechRecognitionService {
  readonly available: boolean
  listen(): Promise<string>
  stop(): void
}

interface RecognitionEventLike { results: ArrayLike<ArrayLike<{ transcript: string }>> }
interface RecognitionLike {
  lang: string; interimResults: boolean; continuous: boolean
  start(): void; stop(): void
  onresult: ((event: RecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionConstructor = new () => RecognitionLike

export class BrowserSpeechRecognitionService implements SpeechRecognitionService {
  private recognition: RecognitionLike | null = null
  private readonly Constructor: RecognitionConstructor | undefined
  constructor() {
    const speechWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
    this.Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
  }
  get available() { return Boolean(this.Constructor) }
  listen() {
    if (!this.Constructor) return Promise.reject(new Error('SPEECH_UNAVAILABLE'))
    return new Promise<string>((resolve, reject) => {
      const recognition = new this.Constructor!()
      this.recognition = recognition
      recognition.lang = 'cs-CZ'; recognition.interimResults = false; recognition.continuous = false
      recognition.onresult = (event) => resolve(event.results[0][0].transcript)
      recognition.onerror = (event) => reject(new Error(event.error === 'not-allowed' ? 'MICROPHONE_DENIED' : 'SPEECH_ERROR'))
      recognition.onend = () => { this.recognition = null }
      recognition.start()
    })
  }
  stop() { this.recognition?.stop(); this.recognition = null }
}

export class ManualTextInputService implements SpeechRecognitionService {
  readonly available = true
  constructor(private readonly getText: () => string) {}
  listen() { return Promise.resolve(this.getText()) }
  stop() {}
}
