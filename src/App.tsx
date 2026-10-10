import { useRef, useState } from 'react'
import { BannerPreview } from './components/BannerPreview'
import { ColorField } from './components/ColorField'
import { DownloadButton } from './components/DownloadButton'
import { FontControls } from './components/FontControls'
import { ImageUpload } from './components/ImageUpload'
import { TextField } from './components/TextField'
import { randomColor } from './lib/color'
import { DEFAULT_FONT } from './lib/fonts'
import type { BannerState } from './types'
import { FONT_SIZE_DEFAULT } from './types'

function initialState(): BannerState {
  return {
    text: 'Sample Text',
    bgColor: randomColor(),
    textColor: '#FFFFFF',
    fontFamily: DEFAULT_FONT.family,
    fontSize: FONT_SIZE_DEFAULT,
    bgImage: null,
  }
}

export default function App() {
  const [state, setState] = useState<BannerState>(initialState)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const update = <K extends keyof BannerState>(key: K, value: BannerState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }))

  return (
    <main className="app">
      <h1>Banner Maker</h1>

      <BannerPreview state={state} canvasRef={canvasRef} />
      <DownloadButton canvasRef={canvasRef} />

      <section className="controls">
        <TextField value={state.text} onChange={(v) => update('text', v)} />
        <FontControls
          fontFamily={state.fontFamily}
          fontSize={state.fontSize}
          onFamilyChange={(v) => update('fontFamily', v)}
          onSizeChange={(v) => update('fontSize', v)}
        />
        <ColorField label="배경색" value={state.bgColor} onChange={(v) => update('bgColor', v)} />
        <ColorField label="글자색" value={state.textColor} onChange={(v) => update('textColor', v)} />
        <ImageUpload value={state.bgImage} onChange={(v) => update('bgImage', v)} />
      </section>

      <footer>
        원본 아이디어: <a href="https://velog.io/@godori/banner-maker">velog 배너 생성기 (godori)</a>
        {' · '}
        폰트는 모두 SIL Open Font License 1.1을 따릅니다.
      </footer>
    </main>
  )
}
