import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppsScriptApi, ApiError } from './appsScriptApi'

afterEach(() => vi.restoreAllMocks())

describe('AppsScriptApi', () => {
  it('posílá token v POST body a ne v URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] })))
    const api = new AppsScriptApi({ baseUrl: 'https://script.google.com/macros/s/example/exec', apiToken: () => 'secret' })
    await api.list()
    expect(fetchMock.mock.calls[0][0]).not.toContain('secret')
    const init = fetchMock.mock.calls[0][1]!
    expect(JSON.parse(String(init.body))).toMatchObject({ action: 'listReminders', apiToken: 'secret' })
    expect(new Headers(init.headers).get('Content-Type')).toBe('text/plain;charset=utf-8')
  })

  it('převádí aplikační chybu na ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      success: false, error: { code: 'INVALID_DATE', message: 'Datum není platné.' },
    })))
    const api = new AppsScriptApi({ baseUrl: 'https://example.test', apiToken: () => 'secret' })
    await expect(api.list()).rejects.toEqual(new ApiError('INVALID_DATE', 'Datum není platné.'))
  })
})
