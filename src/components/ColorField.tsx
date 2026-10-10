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
