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
