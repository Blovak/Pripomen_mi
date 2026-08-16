interface Props {
  listening?: boolean
  onClick: () => void
}

export function MicrophoneButton({ listening = false, onClick }: Props) {
  return (
    <button
      className={`microphone ${listening ? 'is-listening' : ''}`}
      type="button"
      onClick={onClick}
      aria-label={listening ? 'Zastavit poslech' : 'Začít mluvit'}
    >
      <span aria-hidden="true">🎙</span>
      <strong>{listening ? 'Poslouchám…' : 'Mluvit'}</strong>
    </button>
  )
}
