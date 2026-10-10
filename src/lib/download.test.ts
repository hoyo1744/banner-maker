import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadCanvas } from './download'

function fakeCanvas(blob: Blob | null) {
  return {
    toBlob: vi.fn((cb: BlobCallback, type?: string) => {
      expect(type).toBe('image/png')
      cb(blob)
    }),
  } as unknown as HTMLCanvasElement
}

let clicked: { href: string | null; download: string }[]
const createObjectURL = vi.fn(() => 'blob:fake')
const revokeObjectURL = vi.fn()

beforeEach(() => {
  clicked = []
  vi.useFakeTimers()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeObjectURL })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    clicked.push({ href: this.getAttribute('href'), download: this.download })
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  createObjectURL.mockClear()
  revokeObjectURL.mockClear()
})

describe('downloadCanvas', () => {
  it('PNG blob URL로 banner.png 링크를 클릭하고 URL을 해제한다', async () => {
    const ok = await downloadCanvas(fakeCanvas(new Blob(['x'], { type: 'image/png' })))

    expect(ok).toBe(true)
    expect(clicked).toEqual([{ href: 'blob:fake', download: 'banner.png' }])
    expect(document.querySelector('a')).toBeNull()

    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })

  it('파일 이름을 지정할 수 있다', async () => {
    await downloadCanvas(fakeCanvas(new Blob(['x'])), 'my.png')
    expect(clicked[0].download).toBe('my.png')
  })

  it('blob이 null이면 false이고 링크를 만들지 않는다', async () => {
    const ok = await downloadCanvas(fakeCanvas(null))
    expect(ok).toBe(false)
    expect(createObjectURL).not.toHaveBeenCalled()
    expect(clicked).toEqual([])
  })
})
