import { describe, expect, it } from 'vitest'
import { PRESET_COLORS, isValidHex, normalizeHex, randomColor } from './color'

describe('isValidHex', () => {
  it.each(['#abc', '#ABC', '#a1b2c3', '#A1B2C3', ' #abc '])('%s는 유효하다', (v) => {
    expect(isValidHex(v)).toBe(true)
  })

  it.each(['', 'abc', '#ab', '#abcd', '#abcdeg', '#1234567', 'red'])('%s는 유효하지 않다', (v) => {
    expect(isValidHex(v)).toBe(false)
  })
})

describe('normalizeHex', () => {
  it('3자리를 6자리 대문자로 확장한다', () => {
    expect(normalizeHex('#abc')).toBe('#AABBCC')
  })

  it('6자리를 대문자로 바꾼다', () => {
    expect(normalizeHex('#a1b2c3')).toBe('#A1B2C3')
  })

  it('공백을 제거한다', () => {
    expect(normalizeHex('  #fff ')).toBe('#FFFFFF')
  })

  it('유효하지 않으면 null', () => {
    expect(normalizeHex('#12')).toBeNull()
  })
})

describe('randomColor', () => {
  it('#RRGGBB 대문자 형식이다', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomColor()).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('random 0이면 #000000, 1에 가까우면 #FFFFFF', () => {
    expect(randomColor(() => 0)).toBe('#000000')
    expect(randomColor(() => 0.99999999)).toBe('#FFFFFF')
  })
})

describe('PRESET_COLORS', () => {
  it('모두 정규화된 hex다', () => {
    expect(PRESET_COLORS.length).toBe(10)
    PRESET_COLORS.forEach((c) => expect(normalizeHex(c)).toBe(c))
  })
})
