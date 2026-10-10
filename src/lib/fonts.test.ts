import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_FONT, FONTS, fontSpec, getFont, loadFont } from './fonts'

function mockFonts(load: (spec: string, text?: string) => Promise<unknown[]>) {
  const fn = vi.fn(load)
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load: fn } })
  return fn
}

afterEach(() => {
  vi.useRealTimers()
  Reflect.deleteProperty(document, 'fonts')
})

describe('FONTS', () => {
  it('9개이며 기본은 Pretendard 700', () => {
    expect(FONTS).toHaveLength(9)
    expect(DEFAULT_FONT).toEqual({ label: 'Pretendard', family: 'Pretendard', weight: 700 })
  })

  it('family는 중복되지 않는다', () => {
    expect(new Set(FONTS.map((f) => f.family)).size).toBe(FONTS.length)
  })
})

describe('getFont', () => {
  it('family로 찾는다', () => {
    expect(getFont('Jua').label).toBe('Jua')
  })

  it('없으면 기본 폰트', () => {
    expect(getFont('Comic Sans')).toBe(DEFAULT_FONT)
  })
})

describe('fontSpec', () => {
  it('CSS font 단축 표기를 만든다', () => {
    expect(fontSpec(DEFAULT_FONT, 40)).toBe('700 40px "Pretendard"')
  })
})

describe('loadFont', () => {
  it('폰트 스펙과 텍스트를 넘기고, 면이 로딩되면 true', async () => {
    const load = mockFonts(async () => [{}])
    await expect(loadFont(DEFAULT_FONT, 40, '안녕')).resolves.toBe(true)
    expect(load).toHaveBeenCalledWith('700 40px "Pretendard"', '안녕')
  })

  it('텍스트가 비어 있으면 공백 한 칸으로 로딩한다', async () => {
    const load = mockFonts(async () => [{}])
    await loadFont(DEFAULT_FONT, 40, '')
    expect(load).toHaveBeenCalledWith('700 40px "Pretendard"', ' ')
  })

  it('일치하는 면이 없으면 false', async () => {
    mockFonts(async () => [])
    await expect(loadFont(DEFAULT_FONT, 40, 'a')).resolves.toBe(false)
  })

  it('load가 reject하면 false', async () => {
    mockFonts(async () => {
      throw new Error('network')
    })
    await expect(loadFont(DEFAULT_FONT, 40, 'a')).resolves.toBe(false)
  })

  it('타임아웃이 지나면 false', async () => {
    vi.useFakeTimers()
    mockFonts(() => new Promise(() => {}))
    const result = loadFont(DEFAULT_FONT, 40, 'a', 3000)
    await vi.advanceTimersByTimeAsync(3000)
    await expect(result).resolves.toBe(false)
  })

  it('document.fonts가 없으면 false', async () => {
    await expect(loadFont(DEFAULT_FONT, 40, 'a')).resolves.toBe(false)
  })
})
