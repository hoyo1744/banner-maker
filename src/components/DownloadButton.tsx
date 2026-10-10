import type { RefObject } from 'react'
import { downloadCanvas } from '../lib/download'

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>
}

export function DownloadButton({ canvasRef }: Props) {
  const handleClick = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ok = await downloadCanvas(canvas)
    if (!ok) alert('이미지를 만들지 못했습니다. 다시 시도해 주세요.')
  }

  return (
    <button type="button" className="primary" onClick={handleClick}>
      PNG 다운로드
    </button>
  )
}
