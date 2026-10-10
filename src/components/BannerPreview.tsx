import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { fontSpec, getFont, loadFont } from '../lib/fonts'
import { renderBanner } from '../lib/renderBanner'
import type { BannerState } from '../types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../types'

type Props = {
  state: BannerState
  canvasRef: RefObject<HTMLCanvasElement | null>
}

export function BannerPreview({ state, canvasRef }: Props) {
  const font = getFont(state.fontFamily)
  const loadKey = `${fontSpec(font, state.fontSize)}|${state.text}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const draw = () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) renderBanner(ctx, state, font.weight)
    }

    // 로딩에 실패하거나 시간이 넘어도 대체 폰트로 그린다
    loadFont(font, state.fontSize, state.text).then(() => {
      if (cancelled) return
      setLoadedKey(loadKey)
      draw()
    })

    // 타임아웃 뒤에 폰트가 늦게 도착하면 다시 그린다
    const fonts = document.fonts
    const onLoadingDone = () => {
      if (!cancelled) draw()
    }
    fonts?.addEventListener('loadingdone', onLoadingDone)

    return () => {
      cancelled = true
      fonts?.removeEventListener('loadingdone', onLoadingDone)
    }
  }, [state, font, loadKey, canvasRef])

  return (
    <div className="preview">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      {loadedKey !== loadKey && <p className="loading">폰트 로딩 중…</p>}
    </div>
  )
}
