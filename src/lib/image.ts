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
