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
