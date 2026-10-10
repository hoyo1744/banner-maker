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
