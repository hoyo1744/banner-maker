import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_IMAGE_BYTES, loadImage, validateImageFile } from './image'

describe('validateImageFile', () => {
  it('이미지이고 10MB 이하면 null', () => {
    expect(validateImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES })).toBeNull()
  })

  it('이미지가 아니면 에러 메시지', () => {
    expect(validateImageFile({ type: 'application/pdf', size: 10 })).toBe('이미지 파일만 업로드할 수 있습니다.')
  })

  it('10MB를 넘으면 에러 메시지', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1 })).toBe(
      '10MB 이하의 이미지만 업로드할 수 있습니다.',
    )
  })
})

describe('loadImage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('onload가 호출되면 이미지로 resolve', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (this: HTMLImageElement) {
      queueMicrotask(() => this.onload?.(new Event('load')))
    })
    const img = await loadImage('blob:ok')
    expect(img).toBeInstanceOf(HTMLImageElement)
  })

  it('onerror가 호출되면 reject', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'src', 'set').mockImplementation(function (this: HTMLImageElement) {
      queueMicrotask(() => this.onerror?.(new Event('error')))
    })
    await expect(loadImage('blob:bad')).rejects.toThrow('이미지를 읽을 수 없습니다.')
  })
})
