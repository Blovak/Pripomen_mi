import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

const { createMock, speakMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  speakMock: vi.fn(),
}))

vi.mock('../context/RemindersContext', () => ({
  useReminders: () => ({ create: createMock, offline: false }),
}))

vi.mock('../services/speech/textToSpeech', () => ({ speak: speakMock }))

describe('HomePage', () => {
  beforeEach(() => {
    createMock.mockReset().mockResolvedValue(undefined)
    speakMock.mockReset()
  })

  it('úplnou připomínku uloží bez potvrzovací otázky', async () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)

    fireEvent.change(screen.getByLabelText('Nebo odpověď napiš'), {
      target: { value: 'Připomeň mi schůzku s Karlem zítra v 11:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Pokračovat' }))

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('button', { name: 'Uložit připomínku' })).toBeNull()
    expect(screen.queryByText('Mám připomínku uložit?')).toBeNull()
    await waitFor(() => expect(screen.queryByText(/Připomínka je uložená/)).not.toBeNull())
  })
})
