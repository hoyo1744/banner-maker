import { describe, expect, it, vi } from 'vitest'
import type { BannerState } from '../types'
import type { DrawContext } from './renderBanner'
import { coverRect, lineOffsets, renderBanner, splitLines } from './renderBanner'

describe('splitLines', () => {
  it('빈 문자열은 빈 줄 하나', () => {
    expect(splitLines('')).toEqual([''])
  })

  it('\\n과 \\r\\n으로 나눈다', () => {
    expect(splitLines('a\nb\r\nc')).toEqual(['a', 'b', 'c'])
  })

  it('연속 개행과 끝 개행은 빈 줄로 유지한다', () => {
    expect(splitLines('a\n\nb\n')).toEqual(['a', '', 'b', ''])
  })
})

describe('coverRect', () => {
  it('가로로 긴 이미지는 좌우가 잘린다', () => {
    expect(coverRect(1400, 350, 700, 350)).toEqual({ x: -350, y: 0, w: 1400, h: 350 })
  })

  it('세로로 긴 이미지는 위아래가 잘린다', () => {
    expect(coverRect(700, 1400, 700, 350)).toEqual({ x: 0, y: -525, w: 700, h: 1400 })
  })

  it('작은 이미지는 확대해 채운다', () => {
    expect(coverRect(350, 175, 700, 350)).toEqual({ x: 0, y: 0, w: 700, h: 350 })
  })
})

describe('lineOffsets', () => {
  it('한 줄이면 중앙', () => {
    expect(lineOffsets(1, 52, 175)).toEqual([175])
  })

  it('두 줄이면 중앙을 기준으로 위아래 반 줄씩', () => {
    expect(lineOffsets(2, 52, 175)).toEqual([149, 201])
  })

  it('세 줄이면 가운데 줄이 중앙', () => {
    expect(lineOffsets(3, 50, 175)).toEqual([125, 175, 225])
  })
})

function mockCtx() {
  const calls: string[] = []
  const raw = {
    fillStyle: '' as string,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    fillRect: vi.fn(() => calls.push(`fillRect:${raw.fillStyle}`)),
    drawImage: vi.fn(() => calls.push('drawImage')),
    fillText: vi.fn(() => calls.push(`fillText:${raw.fillStyle}`)),
  }
  return { ctx: raw as unknown as DrawContext, raw, calls }
}

const baseState: BannerState = {
  text: '안녕\n하세요',
  bgColor: '#112233',
  textColor: '#FFFFFF',
  fontFamily: 'Pretendard',
  fontSize: 40,
  bgImage: null,
}

describe('renderBanner', () => {
  it('배경색 → 텍스트 순으로 그린다 (이미지 없음)', () => {
    const { ctx, raw, calls } = mockCtx()
    renderBanner(ctx, baseState, 700)

    expect(calls).toEqual(['fillRect:#112233', 'fillText:#FFFFFF', 'fillText:#FFFFFF'])
    expect(raw.fillRect).toHaveBeenCalledWith(0, 0, 700, 350)
    expect(raw.font).toBe('700 40px "Pretendard", sans-serif')
    expect(raw.textAlign).toBe('center')
    expect(raw.textBaseline).toBe('middle')
    expect(raw.fillText).toHaveBeenNthCalledWith(1, '안녕', 350, 149)
    expect(raw.fillText).toHaveBeenNthCalledWith(2, '하세요', 350, 201)
  })

  it('배경 이미지가 있으면 배경색 → 이미지(cover) → 텍스트 순', () => {
    const { ctx, raw, calls } = mockCtx()
    const img = { naturalWidth: 1400, naturalHeight: 350 } as HTMLImageElement
    renderBanner(ctx, { ...baseState, text: 'A', bgImage: img }, 400)

    expect(calls).toEqual(['fillRect:#112233', 'drawImage', 'fillText:#FFFFFF'])
    expect(raw.drawImage).toHaveBeenCalledWith(img, -350, 0, 1400, 350)
  })
})
