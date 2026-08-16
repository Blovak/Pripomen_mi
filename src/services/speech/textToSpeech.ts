export function speak(text: string) {
  if (!('speechSynthesis' in window) || localStorage.getItem('voiceEnabled') === 'false') return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'cs-CZ'
  window.speechSynthesis.speak(utterance)
}
