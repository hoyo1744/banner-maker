import type { BannerState } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../types'

export const LINE_HEIGHT_RATIO = 1.3

export type Rect = { x: number; y: number; w: number; h: number }

export type DrawContext = Pick<
  CanvasRenderingContext2D,
  'fillStyle' | 'font' | 'textAlign' | 'textBaseline' | 'fillRect' | 'drawImage' | 'fillText'
>

export function splitLines(text: string): string[] {
  return text.split(/\r?\n/)
}

// 이미지 비율을 유지하면서 박스를 빈틈없이 덮는 영역 (CSS background-size: cover)
export function coverRect(imgW: number, imgH: number, boxW: number, boxH: number): Rect {
  const scale = Math.max(boxW / imgW, boxH / imgH)
  const w = imgW * scale
  const h = imgH * scale
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h }
}

// 각 줄의 y 좌표 (textBaseline=middle 기준). 블록 전체가 centerY에 오도록 배치한다.
export function lineOffsets(lineCount: number, lineHeight: number, centerY: number): number[] {
  const start = centerY - ((lineCount - 1) * lineHeight) / 2
  return Array.from({ length: lineCount }, (_, i) => start + i * lineHeight)
}

export function renderBanner(ctx: DrawContext, state: BannerState, fontWeight: number): void {
  const width = CANVAS_WIDTH
  const height = CANVAS_HEIGHT

  ctx.fillStyle = state.bgColor
  ctx.fillRect(0, 0, width, height)

  if (state.bgImage) {
    const r = coverRect(state.bgImage.naturalWidth, state.bgImage.naturalHeight, width, height)
    ctx.drawImage(state.bgImage, r.x, r.y, r.w, r.h)
  }

  // 폰트가 아직 로딩되지 않았으면 브라우저가 sans-serif로 대체해 그린다
  ctx.fillStyle = state.textColor
  ctx.font = `${fontWeight} ${state.fontSize}px "${state.fontFamily}", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lines = splitLines(state.text)
  const ys = lineOffsets(lines.length, state.fontSize * LINE_HEIGHT_RATIO, height / 2)
  lines.forEach((line, i) => ctx.fillText(line, width / 2, ys[i]))
}
