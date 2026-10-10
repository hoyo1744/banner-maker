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
