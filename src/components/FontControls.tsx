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
