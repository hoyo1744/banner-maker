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
