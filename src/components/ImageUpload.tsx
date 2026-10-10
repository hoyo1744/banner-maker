import { useEffect, useId, useRef, useState } from 'react'
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
  const inputId = useId()
  // 요청 토큰: 값이 바뀌면 진행 중인 로드는 무효가 된다(연속 업로드·제거·언마운트).
  const requestRef = useRef(0)

  useEffect(
    () => () => {
      requestRef.current++
      revoke(urlRef)
    },
    [],
  )

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

    const id = ++requestRef.current
    const url = URL.createObjectURL(file)
    try {
      const img = await loadImage(url)
      // 더 새로운 요청이 있거나 언마운트·제거된 경우 결과를 버린다.
      if (id !== requestRef.current) {
        URL.revokeObjectURL(url)
        return
      }
      revoke(urlRef)
      urlRef.current = url
      setError(null)
      onChange(img)
    } catch {
      URL.revokeObjectURL(url)
      if (id !== requestRef.current) return
      setError('이미지를 읽을 수 없습니다.')
      input.value = ''
    }
  }

  const handleRemove = () => {
    requestRef.current++
    revoke(urlRef)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }

  return (
    <div className="field">
      <label className="field-label" htmlFor={inputId}>
        배경 이미지
      </label>
      <div className="color-row">
        <input id={inputId} ref={inputRef} type="file" accept="image/*" onChange={handleChange} />
        {value && (
          <button type="button" className="secondary" onClick={handleRemove}>
            제거
          </button>
        )}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
