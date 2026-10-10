# Banner Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** velog 썸네일용 700×350 배너를 브라우저에서 만들고 PNG로 내려받는 정적 웹앱을 만든다.

**Architecture:** Vite + React + TypeScript SPA다. `App`이 `BannerState` 하나를 보유한다. `BannerPreview`가 state가 바뀔 때마다 폰트를 로딩한 뒤 순수 함수 `renderBanner(ctx, state, weight)`로 `<canvas>`에 그린다. 다운로드는 같은 canvas를 `toBlob`으로 PNG로 내보낸다. 서버는 없고, 폰트는 npm 패키지로 빌드에 포함한다.

**Tech Stack:** Vite 8, React 19, TypeScript 6, react-colorful, pretendard, @fontsource/*, Vitest 5 + jsdom, oxlint, Netlify

**Spec:** `docs/superpowers/specs/2026-10-10-banner-maker-design.md`

## Global Constraints

- 캔버스 크기는 700×350으로 고정한다. 상수는 `CANVAS_WIDTH`, `CANVAS_HEIGHT`다.
- 기본값은 다음과 같다.
  - 텍스트 `Sample Text`
  - 글자색 `#FFFFFF`
  - 글꼴 Pretendard(weight 700)
  - 글자 크기 40px
  - 배경색 랜덤
- 글자 크기 범위는 16~120px이고 슬라이더로 조절한다.
- 줄 높이는 `fontSize × 1.3`이다. 텍스트 블록은 가로·세로 모두 중앙에 놓는다.
- hex는 `#RGB`와 `#RRGGBB`만 허용한다. state에는 `#RRGGBB` 대문자로 저장한다.
- 이미지는 `image/*`이고 10MB 이하인 파일만 받는다. 브라우저 안에서 objectURL로만 읽는다.
- 폰트 로딩 타임아웃은 3000ms다.
- 다운로드 파일 이름은 `banner.png`다.
- 폰트는 SIL OFL 1.1 라이선스만 쓰고, 외부 CDN을 쓰지 않는다.
- 서버 코드와 분석 스크립트는 넣지 않는다.
- `tsconfig`에 `verbatimModuleSyntax`가 켜져 있으므로 타입 import는 반드시 `import type`으로 쓴다.
- 커밋 메시지는 한국어로 쓰고, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`를 붙인다.

## 스펙 대비 조정 사항

구현 중 확인된 내용이다. 스펙 문서도 함께 수정한다(Task 1).

- **React 19 사용**: `forwardRef` 대신 `App`이 `canvasRef`를 만들어 `BannerPreview`와 `DownloadButton`에 prop으로 넘긴다.
- **글자 크기 숫자 입력 제외**: 입력하는 도중의 값이 바로 범위로 보정되는 문제가 있어서, 슬라이더와 현재 값 표시만 둔다.
- **`loadFont(font, size, text)`**: 폰트가 unicode-range로 쪼개져 있어서, 실제로 그릴 텍스트를 넘겨야 해당 글자가 든 서브셋이 로딩된다.
- **늦게 도착한 폰트로 다시 그리기**: `document.fonts`의 `loadingdone` 이벤트를 받아서 처리한다.
- **`src/lib/image.ts` 추가**: 업로드 검증과 디코딩을 분리해 테스트한다.

## File Structure

```
banner-maker/
├── index.html                 # lang=ko, title
├── netlify.toml               # Netlify 빌드 설정
├── package.json
├── vite.config.ts             # react 플러그인 + vitest(jsdom)
├── README.md                  # 실행, 테스트, 배포 방법
├── FONTS.md                   # 폰트 라이선스 고지
└── src/
    ├── main.tsx               # 엔트리, fontFaces, styles import
    ├── fontFaces.ts           # 폰트 CSS import만 담당
    ├── App.tsx                # BannerState, 레이아웃
    ├── types.ts               # BannerState, 캔버스·크기 상수
    ├── styles.css
    ├── lib/
    │   ├── color.ts           # isValidHex, normalizeHex, randomColor, PRESET_COLORS
    │   ├── color.test.ts
    │   ├── renderBanner.ts    # splitLines, coverRect, lineOffsets, renderBanner
    │   ├── renderBanner.test.ts
    │   ├── fonts.ts           # FONTS, DEFAULT_FONT, getFont, fontSpec, loadFont
    │   ├── fonts.test.ts
    │   ├── download.ts        # downloadCanvas
    │   ├── download.test.ts
    │   ├── image.ts           # validateImageFile, loadImage
    │   └── image.test.ts
    └── components/
        ├── ColorField.tsx
        ├── TextField.tsx
        ├── FontControls.tsx
        ├── ImageUpload.tsx
        ├── BannerPreview.tsx
        └── DownloadButton.tsx
```

---

### Task 1: 프로젝트 스캐폴딩, 테스트 환경, Netlify 설정

**Files:**
- Create: Vite react-ts 템플릿 전체(임시 디렉터리에서 생성해 복사), `netlify.toml`, `src/types.ts`
- Modify: `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `docs/superpowers/specs/2026-10-10-banner-maker-design.md`
- Delete: `src/App.css`, `src/index.css`, `src/assets/`, `public/icons.svg`
- Test: `src/types.test.ts`(스모크 테스트, 이 Task 끝에 삭제)

**Interfaces:**
- Produces: `src/types.ts`
  - `BannerState`
  - 상수 `CANVAS_WIDTH = 700`, `CANVAS_HEIGHT = 350`, `FONT_SIZE_MIN = 16`, `FONT_SIZE_MAX = 120`, `FONT_SIZE_DEFAULT = 40`
  - npm 스크립트 `test`, `build`, `dev`

- [ ] **Step 1: 템플릿을 임시 디렉터리에 생성해 레포로 복사**

레포에는 이미 `.git`과 `docs/`가 있어서 그 자리에서 바로 스캐폴딩할 수 없다. 임시 디렉터리에 만든 뒤 복사한다.

```bash
cd ~/loopers/banner-maker
TMP=$(mktemp -d)
npm create vite@latest "$TMP/app" -- --template react-ts --no-interactive </dev/null
cp -R "$TMP/app/." .
rm -rf "$TMP"
rm -rf src/assets src/App.css src/index.css public/icons.svg
ls -a
```

Expected: `.gitignore .oxlintrc.json index.html package.json public src tsconfig*.json vite.config.ts README.md docs`

- [ ] **Step 2: 의존성 설치**

```bash
cd ~/loopers/banner-maker
npm pkg set name=banner-maker
npm pkg set scripts.test="vitest run"
npm install
npm install react-colorful pretendard @fontsource/noto-sans-kr @fontsource/noto-serif-kr @fontsource/nanum-gothic @fontsource/nanum-myeongjo @fontsource/nanum-pen-script @fontsource/black-han-sans @fontsource/do-hyeon @fontsource/jua
npm install -D vitest jsdom
```

Expected: 에러 없이 끝난다. `package.json`의 `dependencies`에 위 패키지가 모두 들어간다.

- [ ] **Step 3: `vite.config.ts`를 vitest 설정으로 교체**

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Step 4: `src/types.ts` 작성**

```ts
export const CANVAS_WIDTH = 700
export const CANVAS_HEIGHT = 350

export const FONT_SIZE_MIN = 16
export const FONT_SIZE_MAX = 120
export const FONT_SIZE_DEFAULT = 40

export type BannerState = {
  text: string
  bgColor: string // #RRGGBB
  textColor: string // #RRGGBB
  fontFamily: string // FONTS[].family
  fontSize: number // FONT_SIZE_MIN ~ FONT_SIZE_MAX
  bgImage: HTMLImageElement | null
}
```

- [ ] **Step 5: 스모크 테스트 작성 후 실행**

`src/types.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './types'

describe('types', () => {
  it('캔버스는 700x350이다', () => {
    expect([CANVAS_WIDTH, CANVAS_HEIGHT]).toEqual([700, 350])
  })
})
```

Run: `npm test`
Expected: `Tests  1 passed (1)`

- [ ] **Step 6: 템플릿 데모 코드를 최소 엔트리로 교체**

`src/App.tsx`(Task 9에서 완성한다):

```tsx
export default function App() {
  return <main className="app">Banner Maker</main>
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`index.html`(전체 교체):

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Banner Maker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: `netlify.toml` 작성**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24"
```

- [ ] **Step 8: 스펙 문서에 조정 사항 반영**

`docs/superpowers/specs/2026-10-10-banner-maker-design.md`에서 다음을 바꾼다.

- §2 표의 글자 크기 행: `슬라이더 + 숫자 입력, 16~120px, 기본 40px` → `슬라이더(현재 값 표시), 16~120px, 기본 40px`
- §3: `React 18` → `React 19`
- §5
  - `loadFont(family, size): Promise<boolean>` → `loadFont(font, size, text): Promise<boolean>`
  - 트리의 lib 아래에 `image.ts  # validateImageFile, loadImage`를 추가
  - `BannerPreview`는 canvas ref를 `forwardRef`로 노출한다… 문단 → `App이 canvasRef를 만들어 BannerPreview와 DownloadButton에 prop으로 넘긴다.`
- §7 폰트 로딩 항목 끝에 문장 추가: `늦게 도착한 폰트는 document.fonts의 loadingdone 이벤트로 감지해 다시 그린다.`

- [ ] **Step 9: 빌드 확인, 스모크 테스트 삭제, 커밋**

```bash
cd ~/loopers/banner-maker
npm run build
rm src/types.test.ts
git add -A
git commit -m "Vite+React+TS 프로젝트 스캐폴딩, vitest와 Netlify 설정

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: `✓ built in`, 커밋이 생성된다. `git status`로 `node_modules`와 `dist`가 추적되지 않는지 확인한다. 템플릿의 `.gitignore`에 이미 들어 있다.

---

### Task 2: 색상 유틸 (`color.ts`)

**Files:**
- Create: `src/lib/color.ts`
- Test: `src/lib/color.test.ts`

**Interfaces:**
- Produces:
  - `isValidHex(value: string): boolean`
  - `normalizeHex(value: string): string | null`: 유효하면 `#RRGGBB` 대문자, 아니면 `null`
  - `randomColor(random?: () => number): string`: `#RRGGBB` 대문자
  - `PRESET_COLORS: string[]`: 원형 팔레트에 쓸 10색

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/color.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/color.test.ts`
Expected: FAIL (`Failed to resolve import "./color"`)

- [ ] **Step 3: 구현**

`src/lib/color.ts`:

```ts
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export const PRESET_COLORS = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#3F51B5',
  '#2196F3',
  '#009688',
  '#4CAF50',
  '#FF9800',
  '#795548',
  '#212121',
]

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim())
}

export function normalizeHex(value: string): string | null {
  const trimmed = value.trim()
  if (!HEX_RE.test(trimmed)) return null
  let hex = trimmed.slice(1)
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return `#${hex.toUpperCase()}`
}

export function randomColor(random: () => number = Math.random): string {
  const n = Math.floor(random() * 0x1000000)
  return `#${n.toString(16).padStart(6, '0').toUpperCase()}`
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/color.test.ts`
Expected: PASS(전부 통과)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/color.ts src/lib/color.test.ts
git commit -m "색상 유틸 추가: hex 검증·정규화, 랜덤 색, 프리셋

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 캔버스 렌더링 (`renderBanner.ts`)

**Files:**
- Create: `src/lib/renderBanner.ts`
- Test: `src/lib/renderBanner.test.ts`

**Interfaces:**
- Consumes: `BannerState`, `CANVAS_WIDTH`, `CANVAS_HEIGHT`(from `src/types.ts`)
- Produces:
  - `LINE_HEIGHT_RATIO = 1.3`
  - `splitLines(text: string): string[]`
  - `type Rect = { x: number; y: number; w: number; h: number }`
  - `coverRect(imgW: number, imgH: number, boxW: number, boxH: number): Rect`
  - `lineOffsets(lineCount: number, lineHeight: number, centerY: number): number[]`
  - `type DrawContext = Pick<CanvasRenderingContext2D, 'fillStyle' | 'font' | 'textAlign' | 'textBaseline' | 'fillRect' | 'drawImage' | 'fillText'>`
  - `renderBanner(ctx: DrawContext, state: BannerState, fontWeight: number): void`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/renderBanner.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/renderBanner.test.ts`
Expected: FAIL (`Failed to resolve import "./renderBanner"`)

- [ ] **Step 3: 구현**

`src/lib/renderBanner.ts`:

```ts
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
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/renderBanner.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/renderBanner.ts src/lib/renderBanner.test.ts
git commit -m "배너 캔버스 렌더링 함수 추가: 배경색·cover 이미지·여러 줄 중앙 텍스트

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 폰트 목록과 로딩 (`fonts.ts`, `fontFaces.ts`, `FONTS.md`)

**Files:**
- Create: `src/lib/fonts.ts`, `src/fontFaces.ts`, `FONTS.md`
- Modify: `src/main.tsx`(fontFaces import)
- Test: `src/lib/fonts.test.ts`

**Interfaces:**
- Produces:
  - `type FontOption = { label: string; family: string; weight: number }`
  - `FONTS: FontOption[]`(9개, 첫 번째가 Pretendard)
  - `DEFAULT_FONT: FontOption`
  - `FONT_LOAD_TIMEOUT_MS = 3000`
  - `getFont(family: string): FontOption`: 없으면 `DEFAULT_FONT`
  - `fontSpec(font: FontOption, size: number): string`: 예) `'700 40px "Pretendard"'`
  - `loadFont(font: FontOption, size: number, text: string, timeoutMs?: number): Promise<boolean>`: 로딩에 성공하면 true, 실패·타임아웃·미지원이면 false. reject하지 않는다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/fonts.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/fonts.test.ts`
Expected: FAIL (`Failed to resolve import "./fonts"`)

- [ ] **Step 3: 구현**

`src/lib/fonts.ts`:

```ts
export type FontOption = { label: string; family: string; weight: number }

// 모두 SIL Open Font License 1.1 (FONTS.md 참고)
export const FONTS: FontOption[] = [
  { label: 'Pretendard', family: 'Pretendard', weight: 700 },
  { label: 'Noto Sans KR', family: 'Noto Sans KR', weight: 400 },
  { label: 'Noto Serif KR', family: 'Noto Serif KR', weight: 400 },
  { label: '나눔고딕', family: 'Nanum Gothic', weight: 400 },
  { label: '나눔명조', family: 'Nanum Myeongjo', weight: 400 },
  { label: '나눔펜', family: 'Nanum Pen Script', weight: 400 },
  { label: 'Black Han Sans', family: 'Black Han Sans', weight: 400 },
  { label: 'Do Hyeon', family: 'Do Hyeon', weight: 400 },
  { label: 'Jua', family: 'Jua', weight: 400 },
]

export const DEFAULT_FONT = FONTS[0]

export const FONT_LOAD_TIMEOUT_MS = 3000

export function getFont(family: string): FontOption {
  return FONTS.find((f) => f.family === family) ?? DEFAULT_FONT
}

export function fontSpec(font: FontOption, size: number): string {
  return `${font.weight} ${size}px "${font.family}"`
}

// 폰트가 unicode-range 서브셋으로 나뉘어 있으므로 실제 그릴 텍스트를 넘겨 필요한 서브셋만 받는다.
export async function loadFont(
  font: FontOption,
  size: number,
  text: string,
  timeoutMs: number = FONT_LOAD_TIMEOUT_MS,
): Promise<boolean> {
  const fonts = document.fonts
  if (!fonts) return false

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs)
  })
  const load = fonts.load(fontSpec(font, size), text || ' ').then(
    (faces) => faces.length > 0,
    () => false,
  )

  try {
    return await Promise.race([load, timeout])
  } finally {
    clearTimeout(timer)
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/fonts.test.ts`
Expected: PASS

- [ ] **Step 5: 폰트 CSS import 파일 작성 후 엔트리에 연결**

`src/fontFaces.ts`:

```ts
// 폰트 CSS(@font-face). 브라우저는 실제로 쓰는 weight와 unicode-range 파일만 내려받는다.
import 'pretendard/dist/web/static/pretendard-dynamic-subset.css'
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-serif-kr/400.css'
import '@fontsource/nanum-gothic/400.css'
import '@fontsource/nanum-myeongjo/400.css'
import '@fontsource/nanum-pen-script/400.css'
import '@fontsource/black-han-sans/400.css'
import '@fontsource/do-hyeon/400.css'
import '@fontsource/jua/400.css'
```

`src/main.tsx`의 `import App from './App'` 위에 다음을 추가한다.

```tsx
import './fontFaces'
```

- [ ] **Step 6: `FONTS.md` 작성**

```markdown
# 폰트 라이선스

이 프로젝트에 포함된 폰트는 모두 [SIL Open Font License 1.1](https://openfontlicense.org)을 따릅니다.
상업적 사용, 이미지 삽입, 재배포가 자유롭습니다. 다만 폰트 파일만 따로 판매할 수는 없습니다.

| 폰트 | 저작권자 | 패키지 |
|---|---|---|
| Pretendard | Kil Hyung-jin | `pretendard` |
| Noto Sans KR, Noto Serif KR | Google, Adobe | `@fontsource/noto-sans-kr`, `@fontsource/noto-serif-kr` |
| 나눔고딕, 나눔명조, 나눔펜 | NAVER Corporation | `@fontsource/nanum-gothic`, `@fontsource/nanum-myeongjo`, `@fontsource/nanum-pen-script` |
| Black Han Sans, Do Hyeon, Jua | Woowahan Brothers | `@fontsource/black-han-sans`, `@fontsource/do-hyeon`, `@fontsource/jua` |

각 라이선스 전문은 `node_modules/<패키지>/LICENSE`에 있습니다.
```

- [ ] **Step 7: 빌드 확인 후 커밋**

Run: `npm test && npm run build`
Expected: 테스트 전부 통과. 빌드 결과의 `dist/assets/`에 `.woff2` 파일이 다수 생성된다.

```bash
git add src/lib/fonts.ts src/lib/fonts.test.ts src/fontFaces.ts src/main.tsx FONTS.md
git commit -m "OFL 한글 웹폰트 9종 추가와 폰트 로딩(타임아웃) 구현

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: PNG 다운로드 (`download.ts`)

**Files:**
- Create: `src/lib/download.ts`
- Test: `src/lib/download.test.ts`

**Interfaces:**
- Produces: `downloadCanvas(canvas: HTMLCanvasElement, filename?: string): Promise<boolean>`
  - 기본 파일 이름은 `'banner.png'`다.
  - blob이 null이면 false를 돌려준다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/download.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/download.test.ts`
Expected: FAIL (`Failed to resolve import "./download"`)

- [ ] **Step 3: 구현**

`src/lib/download.ts`:

```ts
export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'banner.png'): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(false)
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      // 클릭 직후 해제하면 일부 브라우저에서 다운로드가 취소되므로 한 틱 미룬다
      setTimeout(() => URL.revokeObjectURL(url), 0)
      resolve(true)
    }, 'image/png')
  })
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/download.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/download.ts src/lib/download.test.ts
git commit -m "캔버스 PNG 다운로드 유틸 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 이미지 업로드 유틸 (`image.ts`)

**Files:**
- Create: `src/lib/image.ts`
- Test: `src/lib/image.test.ts`

**Interfaces:**
- Produces:
  - `MAX_IMAGE_BYTES = 10 * 1024 * 1024`
  - `validateImageFile(file: { type: string; size: number }): string | null`: 에러 메시지 또는 null
  - `loadImage(url: string): Promise<HTMLImageElement>`: 디코딩에 실패하면 reject

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/image.test.ts`:

```ts
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
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- src/lib/image.test.ts`
Expected: FAIL (`Failed to resolve import "./image"`)

- [ ] **Step 3: 구현**

`src/lib/image.ts`:

```ts
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith('image/')) return '이미지 파일만 업로드할 수 있습니다.'
  if (file.size > MAX_IMAGE_BYTES) return '10MB 이하의 이미지만 업로드할 수 있습니다.'
  return null
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다.'))
    img.src = url
  })
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test -- src/lib/image.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add src/lib/image.ts src/lib/image.test.ts
git commit -m "이미지 업로드 검증·디코딩 유틸 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 입력 컴포넌트 (ColorField, TextField, FontControls, ImageUpload)

컴포넌트는 스펙 §8에 따라 단위 테스트 없이 Task 9에서 브라우저로 직접 확인한다. 이 Task에서는 타입 체크와 빌드로 검증한다.

**Files:**
- Create: `src/components/ColorField.tsx`, `src/components/TextField.tsx`, `src/components/FontControls.tsx`, `src/components/ImageUpload.tsx`

**Interfaces:**
- Consumes:
  - `isValidHex`, `normalizeHex`, `PRESET_COLORS`(Task 2)
  - `FONTS`(Task 4)
  - `FONT_SIZE_MIN`, `FONT_SIZE_MAX`(Task 1)
  - `validateImageFile`, `loadImage`(Task 6)
- Produces:
  - `ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void })`
  - `TextField({ value, onChange }: { value: string; onChange: (text: string) => void })`
  - `FontControls({ fontFamily, fontSize, onFamilyChange, onSizeChange }: { fontFamily: string; fontSize: number; onFamilyChange: (family: string) => void; onSizeChange: (size: number) => void })`
  - `ImageUpload({ value, onChange }: { value: HTMLImageElement | null; onChange: (img: HTMLImageElement | null) => void })`
  - CSS 클래스(Task 9의 `styles.css`에서 스타일링): `field`, `field-label`, `color-row`, `swatches`, `swatch`, `hex-input`, `invalid`, `chip`, `text-input`, `font-row`, `error`, `secondary`

- [ ] **Step 1: `ColorField.tsx` 작성**

```tsx
import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { PRESET_COLORS, isValidHex, normalizeHex } from '../lib/color'

type Props = {
  label: string
  value: string
  onChange: (hex: string) => void
}

export function ColorField({ label, value, onChange }: Props) {
  // hex 입력창의 편집 중인 값. 유효할 때만 상위 state에 반영한다.
  const [draft, setDraft] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  // 팔레트나 프리셋으로 값이 바뀌면 입력창도 맞춘다.
  // 사용자가 '#abc'처럼 축약형을 입력 중인 경우는 그대로 둔다.
  if (value !== prevValue) {
    setPrevValue(value)
    if (normalizeHex(draft) !== value) setDraft(value)
  }

  const invalid = !isValidHex(draft)

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="color-row">
        <HexColorPicker color={value} onChange={(c) => onChange(normalizeHex(c) ?? value)} />
        <div>
          <div className="swatches">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="swatch"
                style={{ background: c }}
                aria-label={c}
                aria-pressed={c === value}
                onClick={() => onChange(c)}
              />
            ))}
          </div>
          <div className="color-row">
            <span className="chip" style={{ background: value }} />
            <input
              className={invalid ? 'hex-input invalid' : 'hex-input'}
              value={draft}
              aria-label={`${label} hex`}
              aria-invalid={invalid}
              maxLength={7}
              onChange={(e) => {
                setDraft(e.target.value)
                const hex = normalizeHex(e.target.value)
                if (hex) onChange(hex)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `TextField.tsx` 작성**

```tsx
type Props = {
  value: string
  onChange: (text: string) => void
}

export function TextField({ value, onChange }: Props) {
  return (
    <label className="field">
      <span className="field-label">텍스트 (Enter로 줄바꿈)</span>
      <textarea className="text-input" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
```

- [ ] **Step 3: `FontControls.tsx` 작성**

```tsx
import { FONTS } from '../lib/fonts'
import { FONT_SIZE_MAX, FONT_SIZE_MIN } from '../types'

type Props = {
  fontFamily: string
  fontSize: number
  onFamilyChange: (family: string) => void
  onSizeChange: (size: number) => void
}

export function FontControls({ fontFamily, fontSize, onFamilyChange, onSizeChange }: Props) {
  return (
    <div className="font-row">
      <label className="field">
        <span className="field-label">글꼴</span>
        <select value={fontFamily} onChange={(e) => onFamilyChange(e.target.value)}>
          {FONTS.map((f) => (
            <option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"` }}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">글자 크기: {fontSize}px</span>
        <input
          type="range"
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          value={fontSize}
          onChange={(e) => onSizeChange(Number(e.target.value))}
        />
      </label>
    </div>
  )
}
```

- [ ] **Step 4: `ImageUpload.tsx` 작성**

```tsx
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'
import { loadImage, validateImageFile } from '../lib/image'

type Props = {
  value: HTMLImageElement | null
  onChange: (img: HTMLImageElement | null) => void
}

function revoke(urlRef: RefObject<string | null>) {
  if (urlRef.current) {
    URL.revokeObjectURL(urlRef.current)
    urlRef.current = null
  }
}

export function ImageUpload({ value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null)
  // 현재 배경으로 쓰는 이미지의 objectURL. 교체·제거·언마운트할 때 해제한다.
  const urlRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => revoke(urlRef), [])

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return

    const message = validateImageFile(file)
    if (message) {
      setError(message)
      input.value = ''
      return
    }

    const url = URL.createObjectURL(file)
    try {
      const img = await loadImage(url)
      revoke(urlRef)
      urlRef.current = url
      setError(null)
      onChange(img)
    } catch {
      URL.revokeObjectURL(url)
      setError('이미지를 읽을 수 없습니다.')
      input.value = ''
    }
  }

  const handleRemove = () => {
    revoke(urlRef)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }

  return (
    <div className="field">
      <span className="field-label">배경 이미지</span>
      <div className="color-row">
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} />
        {value && (
          <button type="button" className="secondary" onClick={handleRemove}>
            제거
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: 타입 체크와 빌드**

Run: `npm run build && npm run lint`
Expected: 빌드 성공(컴포넌트는 아직 import되지 않지만 `tsc -b`가 `src` 전체를 검사한다). lint 에러 0.

- [ ] **Step 6: 커밋**

```bash
git add src/components
git commit -m "입력 컴포넌트 추가: 색상(팔레트·hex), 텍스트, 글꼴·크기, 배경 이미지

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 미리보기와 다운로드 컴포넌트 (BannerPreview, DownloadButton)

**Files:**
- Create: `src/components/BannerPreview.tsx`, `src/components/DownloadButton.tsx`

**Interfaces:**
- Consumes:
  - `BannerState`, `CANVAS_WIDTH`, `CANVAS_HEIGHT`(Task 1)
  - `renderBanner`(Task 3)
  - `getFont`, `fontSpec`, `loadFont`(Task 4)
  - `downloadCanvas`(Task 5)
- Produces:
  - `BannerPreview({ state, canvasRef }: { state: BannerState; canvasRef: RefObject<HTMLCanvasElement | null> })`
  - `DownloadButton({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement | null> })`
  - CSS 클래스: `preview`, `loading`, `primary`

- [ ] **Step 1: `BannerPreview.tsx` 작성**

```tsx
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
```

- [ ] **Step 2: `DownloadButton.tsx` 작성**

```tsx
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
```

- [ ] **Step 3: 타입 체크와 빌드**

Run: `npm run build && npm run lint`
Expected: 빌드 성공, lint 에러 0

- [ ] **Step 4: 커밋**

```bash
git add src/components/BannerPreview.tsx src/components/DownloadButton.tsx
git commit -m "배너 미리보기(폰트 로딩 후 렌더링)와 다운로드 버튼 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: App 조립, 스타일, README, 브라우저 검증

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`, `README.md`(템플릿 README 전체 교체)
- Create: `src/styles.css`

**Interfaces:**
- Consumes: Task 1~8의 모든 컴포넌트와 `randomColor`, `DEFAULT_FONT`, `FONT_SIZE_DEFAULT`

- [ ] **Step 1: `src/App.tsx` 작성**

```tsx
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
```

- [ ] **Step 2: `src/styles.css` 작성**

```css
:root {
  --bg: #f6f7f9;
  --surface: #ffffff;
  --text: #1f2328;
  --muted: #656d76;
  --border: #d0d7de;
  --accent: #12b886;
  --accent-text: #ffffff;
  --danger: #cf222e;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --text: #e6edf3;
    --muted: #8d96a0;
    --border: #30363d;
    --accent: #20c997;
    --accent-text: #0d1117;
    --danger: #ff7b72;
    color-scheme: dark;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Pretendard', system-ui, sans-serif;
}

.app {
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h1 {
  margin: 0;
  font-size: 24px;
}

.preview {
  position: relative;
}

.preview canvas {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 700 / 350;
  border: 1px solid var(--border);
  border-radius: 8px;
}

/* 로딩이 짧게 끝날 때 깜빡이지 않도록 200ms 뒤에 보인다 */
.loading {
  position: absolute;
  top: 8px;
  right: 12px;
  margin: 0;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgb(0 0 0 / 0.6);
  color: #fff;
  font-size: 12px;
  opacity: 0;
  animation: show 0s 200ms forwards;
}

@keyframes show {
  to {
    opacity: 1;
  }
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}

.text-input,
select,
.hex-input {
  font: inherit;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
}

.text-input {
  resize: vertical;
}

.font-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  max-width: 220px;
}

.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
}

.swatch[aria-pressed='true'] {
  border-color: var(--text);
}

.chip {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
}

.hex-input {
  width: 110px;
  font-family: ui-monospace, monospace;
}

.hex-input.invalid {
  border-color: var(--danger);
  outline-color: var(--danger);
}

.error {
  margin: 0;
  color: var(--danger);
  font-size: 13px;
}

button.primary,
button.secondary {
  font: inherit;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
}

button.primary {
  align-self: flex-start;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  font-weight: 700;
}

button.secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  padding: 6px 12px;
}

footer {
  font-size: 13px;
  color: var(--muted);
}

footer a {
  color: inherit;
}
```

- [ ] **Step 3: `src/main.tsx`에 스타일 import 추가**

`import './fontFaces'` 아래에 다음을 추가한다.

```tsx
import './styles.css'
```

- [ ] **Step 4: 템플릿 README를 프로젝트 README로 교체**

`README.md`:

````markdown
# Banner Maker

velog 썸네일용 배너(700×350 PNG)를 브라우저에서 만드는 정적 웹앱입니다.
[godori님의 velog 배너 생성기](https://velog.io/@godori/banner-maker)를 바탕으로 다시 만들었습니다.

- 텍스트(여러 줄), 배경색·글자색(팔레트, hex 입력), 한글 웹폰트 9종, 글자 크기, 배경 이미지
- 서버가 없습니다. 업로드한 이미지는 브라우저 밖으로 나가지 않습니다.
- 폰트는 모두 SIL OFL 1.1입니다([FONTS.md](./FONTS.md)).

## 개발

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # 단위 테스트
npm run build   # dist/ 생성
```

## Netlify 배포

### 방법 1. GitHub 연동 (push하면 자동 배포)

1. https://app.netlify.com 에 GitHub 계정으로 로그인합니다.
2. **Add new site → Import an existing project → GitHub**를 선택합니다.
3. `banner-maker` 저장소를 고릅니다. 빌드 설정은 `netlify.toml`에서 자동으로 읽습니다.
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Deploy**를 누르면 `https://<랜덤이름>.netlify.app` 주소가 생깁니다.
   - 주소를 바꾸려면 **Site configuration → Change site name**에서 바꿉니다.
5. 이후 `main`에 push할 때마다 자동으로 다시 배포됩니다.

### 방법 2. CLI로 직접 배포

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist   # 처음 실행하면 새 사이트를 만들지 물어봅니다
```

## Vercel 배포

https://vercel.com/new 에서 저장소를 Import합니다. Vite를 자동으로 인식하므로 추가 설정이 필요 없습니다.
````

- [ ] **Step 5: 전체 테스트, 빌드, lint**

Run: `npm test && npm run build && npm run lint`
Expected: 테스트 전부 통과, 빌드 성공, lint 에러 0

- [ ] **Step 6: 브라우저에서 직접 확인**

Run: `npm run dev`, 그리고 http://localhost:5173 을 연다.

체크리스트:
1. 처음 열면 랜덤 배경색 위에 흰색 `Sample Text`가 Pretendard Bold로 가운데 보인다. 새로고침하면 배경색이 바뀐다.
2. 텍스트에 `안녕하세요\n두 번째 줄`을 입력하면 두 줄이 세로 중앙에 놓인다.
3. 글꼴 9종을 차례로 고르면 캔버스 글꼴이 각각 바뀐다. 한글이 기본 폰트로 그려지는 경우가 없어야 한다.
4. 크기 슬라이더를 16~120까지 움직이면 라벨 값과 캔버스가 같이 바뀐다.
5. 배경색 팔레트를 드래그하면 칩과 hex 입력값이 따라 바뀐다. 프리셋을 누르면 즉시 반영된다.
6. hex에 `#abc`를 입력하면 배경이 `#AABBCC`가 되고, 입력창에는 `#abc`가 그대로 남는다. `#zz`를 입력하면 빨간 테두리가 생기고 캔버스는 직전 색을 유지한다.
7. 글자색을 바꾸면 텍스트 색만 바뀐다.
8. 가로로 긴 사진과 세로로 긴 사진을 각각 업로드하면 비율을 유지하며 꽉 채워진다. **제거**를 누르면 배경색으로 돌아간다.
9. PDF 파일을 업로드하면 `이미지 파일만 업로드할 수 있습니다.`가 표시된다.
10. **PNG 다운로드**를 누르면 `banner.png`(700×350)가 저장되고, 미리보기와 똑같다.
11. 브라우저 폭을 375px로 줄이면 캔버스가 비율을 유지하며 줄어들고, 가로 스크롤이 생기지 않는다.
12. DevTools Network 탭에 외부 도메인 요청이 없다(폰트도 localhost에서 받는다).

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "App 조립, 스타일, README(Netlify 배포 방법) 추가

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
